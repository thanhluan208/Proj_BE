import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { HousesService } from 'src/houses/houses.service';
import { RedisService } from 'src/redis/redis.service';
import { UserService } from 'src/users/users.service';
import { REDIS_PREFIX_KEY } from 'src/utils/constant';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { GetRoomsDto } from './dto/get-rooms.dto';
import { RoomEntity } from './room.entity';
import { RoomRepository } from './room.repository';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { StatusEntity } from 'src/statuses/status.entity';

import { FilesService } from 'src/files/files.service';
import { RoomDetailResponseDto } from './dto/room-detail-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TenantEntity } from 'src/tenant/tenant.entity';
import { IsNull, Repository } from 'typeorm';
import { BillingEntity } from 'src/billing/billing.entity';
import { RoomExpenseEntity } from 'src/room-expenses/room-expense.entity';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);
  private readonly CACHE_ROOM_TTL = 60 * 5; // Cache for 5 minutes
  private readonly CACHE_ROOM_VERSION_KEY = `${REDIS_PREFIX_KEY.room}:version`;

  constructor(
    private redisService: RedisService,
    private userService: UserService,
    private houseService: HousesService,
    private roomsRepository: RoomRepository,
    private filesService: FilesService,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(BillingEntity)
    private readonly billingRepository: Repository<BillingEntity>,
    @InjectRepository(RoomExpenseEntity)
    private readonly roomExpenseRepository: Repository<RoomExpenseEntity>,
  ) {}

  async create(createRoomDto: CreateRoomDto, userJwtPayload: JwtPayloadType) {
    const currentUser = await this.userService.findById(userJwtPayload.id);

    this.logger.log(`Checking if house exists with ID: ${createRoomDto.house}`);
    const house = await this.houseService.findById(
      createRoomDto.house,
      currentUser.id,
    );

    if (!house) {
      this.logger.error(`House not found with ID: ${createRoomDto.house}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          house: 'houseNotFound',
        },
      });
    }

    this.logger.log(
      `House owner ID: ${house.owner?.id}, Current user ID: ${currentUser.id}`,
    );

    const room = await this.roomsRepository.create({
      ...createRoomDto,
      house: house,
      status: {
        id: StatusEnum.active,
      } as StatusEntity,
    });

    // Create folder for room
    await this.filesService.createFolder(`${house.id}/${room.id}`);

    await this.redisService.incr(
      `${this.CACHE_ROOM_VERSION_KEY}:${currentUser.id}:${house.id}`,
    );

    this.logger.log(`Room created successfully with ID: ${room.id}`);
    return room;
  }

  async update(
    id: string,
    updateRoomDto: UpdateRoomDto,
    userId: string,
  ): Promise<RoomEntity | null> {
    const room = await this.findById(id, userId);

    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          room: 'roomNotFound',
        },
      });
    }

    const { house: houseId, ...rest } = updateRoomDto;

    if (houseId) {
      const house = await this.houseService.findById(houseId, userId);
      if (!house) {
        throw new BadRequestException({
          status: HttpStatus.BAD_REQUEST,
          errors: {
            house: 'houseNotFound',
          },
        });
      }

      room.house = house;
    }

    const updatedRoom = { ...room, ...rest };

    const result = await this.roomsRepository.update(id, {
      ...updatedRoom,
    });

    await this.redisService.del(`${REDIS_PREFIX_KEY.room}:${id}`);
    await this.redisService.incr(
      `${this.CACHE_ROOM_VERSION_KEY}:${userId}:${room.house.id}`,
    );

    return result;
  }

  async findById(id: string, userId: string): Promise<RoomEntity> {
    this.logger.log(`Finding room with ID: ${id}`);

    const cacheKey = `${REDIS_PREFIX_KEY.room}:${id}`;

    let room: RoomEntity | null = null;

    const cachedRoom = await this.redisService.get(cacheKey);
    if (cachedRoom) {
      this.logger.log(`Room found in cache for ID: ${id}`);
      room = JSON.parse(cachedRoom);
    } else {
      this.logger.log(`Room not found in cache for ID: ${id}`);
      room = await this.roomsRepository.findByIdAndOwner(id, userId);
      if (room) {
        await this.redisService.set(
          cacheKey,
          JSON.stringify(room),
          this.CACHE_ROOM_TTL,
        );
        this.logger.log(`Room cached for ID: ${id}`);
      } else {
        this.logger.warn(`Room not found with ID: ${id}`);
        throw new BadRequestException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Room not found',
        });
      }
    }

    return room as RoomEntity;
  }

  async getRoomDetail(
    id: string,
    userId: string,
  ): Promise<RoomDetailResponseDto> {
    const room = await this.findById(id, userId);

    const totalTenants = await this.tenantRepository.count({
      where: {
        room: { id: room.id },
        deletedAt: IsNull(),
      },
    });

    const totalIncomeResult = await this.billingRepository
      .createQueryBuilder('billing')
      .select('SUM(billing.total_amount)', 'sum')
      .where('billing.roomId = :roomId', { roomId: room.id })
      .getRawOne();

    const totalExpensesResult = await this.roomExpenseRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'sum')
      .where('expense.roomId = :roomId', { roomId: room.id })
      .getRawOne();

    return {
      ...room,
      totalTenants,
      totalIncome: Number(totalIncomeResult?.sum || 0),
      totalExpenses: Number(totalExpensesResult?.sum || 0),
    } as RoomDetailResponseDto;
  }

  async findByHouse(
    userId: string,
    payload: GetRoomsDto,
  ): Promise<PaginatedResponseDto<RoomEntity>> {
    // Check if house exists
    const house = await this.houseService.findById(payload.house, userId);
    if (!house) {
      this.logger.error(`House not found with ID: ${payload.house}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          house: 'houseNotFound',
        },
      });
    }

    // Pagination
    const { page = 1, pageSize = 10 } = payload;
    const skip = (page - 1) * pageSize;

    const cacheVersion =
      (await this.redisService.get(
        `${this.CACHE_ROOM_VERSION_KEY}:${userId}:${house.id}`,
      )) ?? '0';

    const cacheKey = `${REDIS_PREFIX_KEY.room}:${house.id}:${page}:${pageSize}:v${cacheVersion}`;

    let rooms: RoomEntity[] = [];

    const cachedRooms = await this.redisService.get(cacheKey);
    if (cachedRooms) {
      rooms = JSON.parse(cachedRooms);
    } else {
      this.logger.log(`Rooms not found in cache for house ID: ${house.id}`);
      // Get rooms
      rooms = await this.roomsRepository.findByHouse(house.id, {
        skip,
        take: pageSize,
      });
      console.log('Rooms:', rooms);
      if (rooms.length > 0 && rooms?.length === pageSize) {
        await this.redisService.set(
          cacheKey,
          JSON.stringify(rooms),
          this.CACHE_ROOM_TTL,
        );
      }
    }

    return {
      data: rooms,
      page,
      pageSize,
    };
  }

  async countByHouse(
    userId: string,
    house_id: string,
  ): Promise<PaginationInfoResponseDto> {
    // Check if house exists
    const house = await this.houseService.findById(house_id, userId);
    if (!house) {
      this.logger.error(`House not found with ID: ${house_id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          house: 'houseNotFound',
        },
      });
    }

    const cacheVersion =
      (await this.redisService.get(
        `${this.CACHE_ROOM_VERSION_KEY}:${userId}:${house.id}`,
      )) ?? '0';

    const cacheKey = `${REDIS_PREFIX_KEY.room}:${house.id}:v${cacheVersion}:total`;

    let total = 0;
    const cachedTotal = await this.redisService.get(cacheKey);
    if (cachedTotal) {
      this.logger.log(`Total rooms found in cache for house ID: ${house.id}`);
      total = JSON.parse(cachedTotal) as number;
    } else {
      this.logger.log(
        `Total rooms not found in cache for house ID: ${house.id}`,
      );
      total = await this.roomsRepository.countByHouse(house.id);
      if (total) {
        await this.redisService.set(
          cacheKey,
          JSON.stringify(total),
          this.CACHE_ROOM_TTL,
        );
        this.logger.log(`Total rooms cached for house ID: ${house.id}`);
      } else {
        this.logger.warn(`No rooms found for house ID: ${house.id} to cache`);
      }
    }

    // Count rooms
    return { total };
  }
}
