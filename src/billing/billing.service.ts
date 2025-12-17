import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { RedisService } from 'src/redis/redis.service';
import { RoomEntity } from 'src/rooms/room.entity';
import { RoomsService } from 'src/rooms/rooms.service';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { TenantContractsService } from 'src/tenant-contracts/tenant-contracts.service';
import { BillingStatusEnum, BillingTypeEnum } from './billing-status.enum';
import { BillingRepository } from './billing.repository';
import { CreateBillingDto } from './dto/create-billing.dto';
import { PayBillingDto } from './dto/pay-billing.dto';

import { createHash } from 'crypto';
import dayjs from 'dayjs';
import { I18nService } from 'nestjs-i18n';
import { FileEntity } from 'src/files/file.entity';
import { FilesService } from 'src/files/files.service';
import { REDIS_PREFIX_KEY } from 'src/utils/constant';
import { SortOrder } from 'src/utils/types/common.type';
import { BillingEntity } from './billing.entity';
import { calculateBillCost, generateBillingExcel } from './billing.util';
import { BillingSortField, GetBillingDto } from './dto/get-billing.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly CACHE_BILLING_TTL = 60 * 5; // 5 minutes
  private readonly CACHE_BILLING_VERSION_KEY = `${REDIS_PREFIX_KEY.billing}:version`;
  private readonly CACHED_KEY = {
    getTotalBillByRoom: 'getTotalBillByRoom',
    findBillsByRoom: 'findBillsByRoom',
  };

  constructor(
    private readonly repository: BillingRepository,
    private readonly roomService: RoomsService,
    private readonly tenantContractService: TenantContractsService,
    private readonly redisService: RedisService,
    private readonly i18nService: I18nService,
    private readonly fileService: FilesService,
  ) {}

  async create(dto: CreateBillingDto, user: JwtPayloadType) {
    await this.validateCreate(dto);

    const { currentTenantContract, file, totalAmount } =
      await this.generateBill(dto, user);

    const newBill = await this.repository.create({
      room: {
        id: dto.roomId,
      } as RoomEntity,
      total_amount: totalAmount,
      status: BillingStatusEnum.PENDING_TENANT_PAYMENT,
      tenantContract: currentTenantContract,
      from: dto.from,
      to: dto.to,
      file: file,
      water_end_index: dto.water_end_index,
      water_start_index: dto.water_start_index,
      electricity_end_index: dto.electricity_end_index,
      electricity_start_index: dto.electricity_start_index,
      type: dto.type,
    });

    await this.redisService.incr(
      `${this.CACHE_BILLING_VERSION_KEY}:${user.id}`,
    );

    return newBill;
  }

  async delete(id: string, user: JwtPayloadType) {
    const targetBill = await this.repository.findById(id, user.id);
    if (!targetBill) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No bill found',
      });
    }

    await this.repository.softDelete(id);
    await this.redisService.incr(
      `${this.CACHE_BILLING_VERSION_KEY}:${user.id}`,
    );

    return targetBill;
  }

  async update(id: string, dto: CreateBillingDto, user: JwtPayloadType) {
    await this.validateCreate(dto, id);

    const targetBill = await this.repository.findById(id, user.id, [
      'tenantContract',
      'tenantContract.tenant',
      'tenantContract.contract',
      'tenantContract.tenant.status',
      'tenantContract.contract.status',
    ]);

    await this.validateEdit(targetBill, dto);

    const { currentTenantContract, file, totalAmount } =
      await this.generateBill(dto, user);

    const newBill = await this.repository.update(id, {
      room: {
        id: dto.roomId,
      } as RoomEntity,
      total_amount: totalAmount,
      status: BillingStatusEnum.PENDING_TENANT_PAYMENT,
      tenantContract: currentTenantContract,
      from: dto.from,
      to: dto.to,
      file: file,
      water_end_index: dto.water_end_index,
      water_start_index: dto.water_start_index,
      electricity_end_index: dto.electricity_end_index,
      electricity_start_index: dto.electricity_start_index,
    });

    await this.redisService.incr(
      `${this.CACHE_BILLING_VERSION_KEY}:${user.id}`,
    );
    return newBill;
  }

  async pay(
    id: string,
    dto: PayBillingDto,
    user: JwtPayloadType,
    file?: Express.Multer.File,
  ) {
    const targetBill = await this.repository.findById(id, user.id, [
      'room',
      'room.house',
      'room.house.owner',
    ]);

    if (!targetBill) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No bill found',
      });
    }

    if (targetBill.status === BillingStatusEnum.PAID) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'This bill have been already paid! Can not update.',
      });
    }
    const room = targetBill.room;

    let proof: FileEntity | undefined = undefined;

    if (file) {
      const fileName = `proof-${targetBill.id}-${dayjs().format('DD_MM_YYYY_HH_mm_ss')}`;
      const filePath = `${user.id}/${room.house.name}/${room.name}/billing/${dayjs(targetBill.from).format('MM-YYYY')}/${fileName}`;

      const uploadedFile = await this.fileService.uploadFileWithCustomPath(
        file,
        filePath,
        user.id,
      );

      proof = {
        ...new FileEntity(),
        ...uploadedFile,
      };
    }

    const result = await this.repository.update(id, {
      payment_date: dto.paymentDate,
      status: BillingStatusEnum.PAID,
      proof,
    });

    await this.redisService.incr(
      `${this.CACHE_BILLING_VERSION_KEY}:${user.id}`,
    );

    return result;
  }

  async download(id: string, user: JwtPayloadType) {
    const targetBill = await this.repository.findById(id, user.id, ['file']);
    if (!targetBill) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No bill found',
      });
    }

    if (!targetBill.file) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No file found',
      });
    }

    return this.fileService.getFileStream(targetBill.file.id);
  }

  async downloadProof(id: string, user: JwtPayloadType) {
    const targetBill = await this.repository.findById(id, user.id, ['proof']);
    if (!targetBill) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No bill found',
      });
    }

    if (!targetBill.proof) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No proof found',
      });
    }

    return this.fileService.getFileStream(targetBill.proof.id);
  }

  async generateBill(dto: CreateBillingDto, user: JwtPayloadType) {
    const { roomId } = dto;

    const room = await this.roomService.findById(roomId, user.id, [
      'contracts',
      'contracts.status',
    ]);
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Room not found',
      });
    }

    const activeContract = room.contracts.find(
      (elm) => elm.status?.id === StatusEnum.active,
    );

    if (!activeContract) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No active contract ',
      });
    }

    const currentTenantContract =
      await this.tenantContractService.findByMainContract(
        activeContract?.id,
        user.id,
        ['contract', 'tenant'],
      );

    if (!currentTenantContract) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No active contract ',
      });
    }

    const { contract, tenant } = currentTenantContract;

    // 3. Calculate Costs
    const { billingItems, totalAmount, utilityDetails } = calculateBillCost(
      dto,
      contract,
      this.i18nService,
    );

    const buffer = await generateBillingExcel(
      {
        room,
        contract,
        tenant,
        from: dto.from,
        to: dto.to,
        notes: dto.notes,
        utilityDetails,
        items: billingItems,
        totalAmount: totalAmount,
      },
      this.i18nService,
    );
    const fileName = `invoice-${dto.type}.xlsx`;
    const filePath = `${user.id}/${room.house.name}/${room.name}/billing/${dayjs(dto.from).format('MM-YYYY')}/${fileName}`;

    const file = await this.fileService.uploadBufferWithCustomPath(
      buffer,
      filePath,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName,
      user.id,
    );

    return {
      file,
      currentTenantContract,
      totalAmount,
    };
  }

  async getTotalBillByRoom(dto: GetBillingDto, user: JwtPayloadType) {
    const { room: roomId, sortBy, sortOrder, ...options } = dto;
    const userId = user.id;

    const cacheVersion = await this.getCacheVersion(user.id);

    const hashKey = createHash('sha256')
      .update(
        JSON.stringify({
          ...options,
          roomId,
          userId,
          isCounting: true,
        }),
      )
      .digest('hex');

    const cachedKey = `${this.CACHED_KEY.getTotalBillByRoom}:${hashKey}:${cacheVersion}`;

    let total = 0;
    const cachedTotal = await this.redisService.get(cachedKey);
    if (cachedTotal) {
      return {
        total: Number(JSON.parse(cachedTotal)),
      };
    }

    const room = this.roomService.findById(roomId, userId);
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: '[msg]',
      });
    }

    total = (await this.repository.findByRoom({
      roomId,
      userId,
      isCounting: true,
      ...options,
    })) as number;

    if (total > 0) {
      this.redisService.set(
        cachedKey,
        JSON.stringify(total),
        this.CACHE_BILLING_TTL,
      );
    }

    return {
      total,
    };
  }

  async getBillsByRoom(dto: GetBillingDto, user: JwtPayloadType) {
    const { room: roomId, sortBy, sortOrder, ...options } = dto;
    const userId = user.id;

    const cacheVersion = await this.getCacheVersion(user.id);

    const hashKey = createHash('sha256')
      .update(
        JSON.stringify({
          ...options,
          roomId,
          userId,
          sortBy,
          sortOrder,
        }),
      )
      .digest('hex');

    const cachedKey = `${this.CACHED_KEY.findBillsByRoom}:${hashKey}:${cacheVersion}`;

    const cachedData = await this.redisService.get(cachedKey);
    if (cachedData) {
      return {
        page: options.page || 1,
        pageSize: options.pageSize || 10,
        data: JSON.parse(cachedData) as BillingEntity[],
      };
    }

    const room = this.roomService.findById(roomId, userId);
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: '[msg]',
      });
    }

    const bills = (await this.repository.findByRoom(
      {
        roomId,
        userId,
        sortBy: dto.sortBy as BillingSortField,
        sortOrder: dto.sortOrder as SortOrder,
        ...options,
      },
      [
        'tenantContract',
        'tenantContract.tenant',
        'tenantContract.contract',
        'tenantContract.tenant.status',
        'tenantContract.contract.status',
      ],
    )) as BillingEntity[];

    if (bills.length > 0) {
      this.redisService.set(
        cachedKey,
        JSON.stringify(bills),
        this.CACHE_BILLING_TTL,
      );
    }

    return {
      page: options.page || 1,
      pageSize: options.pageSize || 10,
      data: bills,
    };
  }

  async getCacheVersion(userId: string) {
    const cachedVersion = 0;
    const dataCached = await this.redisService.get(
      `${this.CACHE_BILLING_VERSION_KEY}:${userId}`,
    );

    if (dataCached) return JSON.parse(dataCached) as number;
    else
      this.redisService.set(
        `${this.CACHE_BILLING_VERSION_KEY}:${userId}`,
        JSON.stringify(cachedVersion),
        86400,
      );

    return cachedVersion;
  }

  async validateCreate(dto: CreateBillingDto, currentBillId?: string) {
    const indexesProvided =
      dto.electricity_start_index != null ||
      dto.electricity_end_index != null ||
      dto.water_start_index != null ||
      dto.water_end_index != null;

    this.logger.log({ dto, indexesProvided });

    if (dto.type !== BillingTypeEnum.USAGE_BASED && indexesProvided) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: `Recurring type of bill should not include indexes info.`,
      });
    }

    const duplicateBill = await this.repository.findDuplicateBill(
      dto.roomId,
      dto.type,
      dto.from,
    );

    if (
      (!!currentBillId &&
        !!duplicateBill &&
        duplicateBill.id !== currentBillId) ||
      !!duplicateBill
    ) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'A bill of this type already exists for this month range.',
      });
    }
  }

  async validateEdit(targetBill: BillingEntity | null, dto: CreateBillingDto) {
    const indexesProvided =
      dto.electricity_start_index != null ||
      dto.electricity_end_index != null ||
      dto.water_start_index != null ||
      dto.water_end_index != null;

    this.logger.log({ dto, indexesProvided });

    if (dto.type !== BillingTypeEnum.USAGE_BASED && indexesProvided) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: `Recurring type of bill should not include indexes info.`,
      });
    }

    if (!targetBill) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No bill found',
      });
    }

    if (targetBill.status === BillingStatusEnum.PAID) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'This bill have been already paid! Can not update.',
      });
    }

    if (
      !targetBill.tenantContract.tenant?.status?.id &&
      targetBill.tenantContract.tenant?.status?.id === StatusEnum.inactive
    ) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'This tenant is already deactivated',
      });
    }

    if (
      !targetBill.tenantContract.contract?.status?.id &&
      targetBill.tenantContract.contract?.status?.id === StatusEnum.inactive
    ) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'This contract is already deactivated',
      });
    }
  }
}
