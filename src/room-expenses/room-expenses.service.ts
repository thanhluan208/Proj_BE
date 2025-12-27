import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { FilesService } from 'src/files/files.service';
import { RedisService } from 'src/redis/redis.service';
import { RoomExpenseEntity } from 'src/room-expenses/room-expense.entity';
import { RoomRepository } from 'src/rooms/room.repository';
import { REDIS_PREFIX_KEY } from 'src/utils/constant';
import { PaginatedResponseDto } from 'src/utils/dto/paginated-response.dto';
import { EditRoomExpenseDto, Expense } from './dto/create-room-expense.dto';
import { GetRoomExpensesDto } from './dto/get-room-expense.dto';
import { RoomExpenseRepository } from './room-expense.repository';
import { convertToUTC, convertFromUTC } from 'src/utils/date-utils';

@Injectable()
export class RoomExpensesService {
  private readonly CACHE_ROOM_EXPENSE_TTL = 60 * 5; // 5 minutes
  private readonly CACHE_ROOM_EXPENSE_VERSION_KEY = `${REDIS_PREFIX_KEY.roomExpense}:version`;
  private readonly CACHED_KEY = {};
  private readonly logger = new Logger(RoomExpensesService.name);

  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly redisService: RedisService,
    private readonly expenseRepository: RoomExpenseRepository,
    private readonly fileService: FilesService,
  ) {}

  async create(
    roomId: string,
    expensesRaw: string,
    receipts: Express.Multer.File[],
    user: JwtPayloadType,
    timezone: string = 'UTC',
  ) {
    const room = await this.roomRepository.findByIdAndOwner(roomId, user.id);

    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { room: 'roomNotFound' },
      });
    }

    const expenses = JSON.parse(expensesRaw) as Expense[];

    let fileIndex = 0;
    const parsedExpense = await Promise.all(
      expenses.map(async (elm) => {
        // Convert expense date to UTC and keep it as string for the entity
        const utcDate = convertToUTC(elm.date, timezone);
        elm.date = utcDate ? utcDate.toISOString().split('T')[0] : elm.date;

        if (elm.hasFile) {
          const fileName = elm.name;
          const filePath = `${user.id}/${room.house.id}/${room.id}/expense_receipts/${fileName}`;

          const expense = {
            room,
            name: elm.name,
            amount: elm.amount,
            isAssetHandedOver: elm.isAssetHandedOver,
            date: elm.date,
            notes: elm.notes,
            receipt: (
              await this.fileService.uploadFileWithCustomPath(
                receipts[fileIndex],
                filePath,
                user.id,
              )
            ).file,
          };

          fileIndex++;
          return expense;
        } else {
          return {
            room,
            name: elm.name,
            isAssetHandedOver: elm.isAssetHandedOver,
            amount: elm.amount,
            date: elm.date,
            notes: elm.notes,
          };
        }
      }),
    );

    const result = await this.expenseRepository.create(parsedExpense);
    return result.map((expense) =>
      this.formatRoomExpenseResponse(expense, timezone),
    );
  }

  async update(
    id: string,
    payload: EditRoomExpenseDto,
    user: JwtPayloadType,
    timezone: string = 'UTC',
    receipt?: Express.Multer.File,
  ) {
    // Convert expense date to UTC
    if (payload.date) {
      const utcDate = convertToUTC(payload.date, timezone);
      payload.date = utcDate
        ? utcDate.toISOString().split('T')[0]
        : payload.date;
    }

    const existingExpense = await this.expenseRepository.findById(id, [
      'room',
      'room.house',
    ]);
    if (!existingExpense) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { expense: 'roomExpenseNotFound' },
      });
    }

    const roomId = payload.roomId ?? existingExpense.room.id;
    const room = await this.roomRepository.findByIdAndOwner(roomId, user.id);
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { room: 'roomNotFound' },
      });
    }

    if (payload.hasFile && receipt?.buffer) {
      const fileName = payload.name || existingExpense.name;
      const filePath = `${user.id}/${room.house.id}/${room.id}/expense_receipts/${fileName}`;

      const file = await this.fileService.uploadFileWithCustomPath(
        receipt,
        filePath,
        user.id,
      );
      existingExpense.receipt = file.file;
    } else if (!payload.hasFile) {
      existingExpense.receipt = null;
    }

    await this.redisService.incr(
      `${this.CACHE_ROOM_EXPENSE_VERSION_KEY}:${user.id}:${room.id}`,
    );

    const result = await this.expenseRepository.update(id, {
      ...existingExpense,
      room,
      name: payload.name ?? existingExpense.name,
      amount: payload.amount ?? existingExpense.amount,
      date: payload.date ?? existingExpense.date,
      isAssetHandedOver:
        payload.isAssetHandedOver ?? existingExpense.isAssetHandedOver,
      notes: payload.notes || null,
    });

    return result ? this.formatRoomExpenseResponse(result, timezone) : null;
  }

  async delete(id: string, user: JwtPayloadType) {
    const current = await this.expenseRepository.findById(id, ['room']);
    if (!current) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { expense: 'roomExpenseNotFound' },
      });
    }

    const room = await this.roomRepository.findByIdAndOwner(
      current.room.id,
      user.id,
    );
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { room: 'roomNotFound' },
      });
    }

    await this.expenseRepository.remove(id);

    await this.redisService.incr(
      `${this.CACHE_ROOM_EXPENSE_VERSION_KEY}:${user.id}:${room.id}`,
    );
    return this.formatRoomExpenseResponse(current, 'UTC');
  }

  async findByRoom(
    user: JwtPayloadType,
    payload: GetRoomExpensesDto,
    timezone: string = 'UTC',
  ): Promise<PaginatedResponseDto<RoomExpenseEntity>> {
    // Check if room exists
    const room = await this.roomRepository.findByIdAndOwner(
      payload.room,
      user.id,
    );
    if (!room) {
      this.logger.error(`Room not found with ID: ${payload.room}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          room: 'roomNotFound',
        },
      });
    }

    // Convert date filters to UTC
    if (payload.from) {
      const utcDate = convertToUTC(payload.from, timezone);
      payload.from = utcDate
        ? utcDate.toISOString().split('T')[0]
        : payload.from;
    }
    if (payload.to) {
      const utcDate = convertToUTC(payload.to, timezone);
      payload.to = utcDate ? utcDate.toISOString().split('T')[0] : payload.to;
    }

    // Pagination
    const { page = 1, pageSize = 10 } = payload;
    const skip = (page - 1) * pageSize;

    // Create filter hash for cache key
    const filters = {
      from: payload.from,
      to: payload.to,
      search: payload.search,
      amount: payload.amount,
      comparison: payload.comparison,
      sortBy: payload.sortBy,
      sortOrder: payload.sortOrder,
      isAssetHandedOver: payload.isAssetHandedOver,
    };
    const filterHash = createHash('sha256')
      .update(JSON.stringify(filters))
      .digest('hex');

    const cacheVersion =
      (await this.redisService.get(
        `${this.CACHE_ROOM_EXPENSE_VERSION_KEY}:${user.id}:${room.id}`,
      )) ?? '0';

    const cacheKey = `${REDIS_PREFIX_KEY.roomExpense}:${room.id}:${page}:${pageSize}:${filterHash}:v${cacheVersion}`;

    let expenses: RoomExpenseEntity[] = [];

    const cachedExpenses = await this.redisService.get(cacheKey);
    if (cachedExpenses) {
      this.logger.log(`Room expenses found in cache for room ID: ${room.id}`);
      expenses = JSON.parse(cachedExpenses);
    } else {
      this.logger.log(
        `Room expenses not found in cache for room ID: ${room.id}`,
      );
      // Get expenses with filters
      expenses = await this.expenseRepository.findByRoom(room.id, {
        skip,
        take: pageSize,
        from: payload.from,
        to: payload.to,
        search: payload.search,
        amount: payload.amount,
        comparison: payload.comparison,
        sortBy: payload.sortBy,
        sortOrder: payload.sortOrder,
        isAssetHandedOver: payload.isAssetHandedOver,
      });

      if (expenses.length > 0 && expenses?.length === pageSize) {
        await this.redisService.set(
          cacheKey,
          JSON.stringify(expenses),
          this.CACHE_ROOM_EXPENSE_TTL,
        );
        this.logger.log(`Room expenses cached for room ID: ${room.id}`);
      }
    }

    const formattedExpenses = expenses.map((expense) =>
      this.formatRoomExpenseResponse(expense, timezone),
    );

    return {
      data: formattedExpenses,
      page,
      pageSize,
    };
  }

  private formatRoomExpenseResponse(
    expense: RoomExpenseEntity,
    timezone: string,
  ): RoomExpenseEntity {
    if (expense.date) {
      expense.date = convertFromUTC(
        expense.date,
        timezone,
        'YYYY-MM-DD',
      ) as any;
    }
    return expense;
  }

  async countByRoom(
    roomId: string,
    user: JwtPayloadType,
    filters?: {
      from?: string;
      to?: string;
      search?: string;
      amount?: number;
      comparison?: 'bigger' | 'smaller';
    },
    timezone: string = 'UTC',
  ): Promise<{ total: number }> {
    // Check if room exists
    const room = await this.roomRepository.findByIdAndOwner(roomId, user.id);
    if (!room) {
      this.logger.error(`Room not found with ID: ${roomId}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          room: 'roomNotFound',
        },
      });
    }

    // Convert date filters to UTC
    if (filters?.from) {
      const utcDate = convertToUTC(filters.from, timezone);
      filters.from = utcDate
        ? utcDate.toISOString().split('T')[0]
        : filters.from;
    }
    if (filters?.to) {
      const utcDate = convertToUTC(filters.to, timezone);
      filters.to = utcDate ? utcDate.toISOString().split('T')[0] : filters.to;
    }

    // Create filter hash for cache key
    const filterHash = createHash('sha256')
      .update(JSON.stringify(filters || {}))
      .digest('hex');

    const cacheVersion =
      (await this.redisService.get(
        `${this.CACHE_ROOM_EXPENSE_VERSION_KEY}:${user.id}:${room.id}`,
      )) ?? '0';

    const cacheKey = `${REDIS_PREFIX_KEY.roomExpense}:${room.id}:${filterHash}:v${cacheVersion}:total`;

    let total = 0;
    const cachedTotal = await this.redisService.get(cacheKey);
    if (cachedTotal) {
      this.logger.log(
        `Total room expenses found in cache for room ID: ${room.id}`,
      );
      total = JSON.parse(cachedTotal) as number;
    } else {
      this.logger.log(
        `Total room expenses not found in cache for room ID: ${room.id}`,
      );
      total = await this.expenseRepository.countByRoom(room.id, filters);
      if (total) {
        await this.redisService.set(
          cacheKey,
          JSON.stringify(total),
          this.CACHE_ROOM_EXPENSE_TTL,
        );
        this.logger.log(`Total room expenses cached for room ID: ${room.id}`);
      } else {
        this.logger.warn(
          `No room expenses found for room ID: ${room.id} to cache`,
        );
      }
    }

    return { total };
  }
}
