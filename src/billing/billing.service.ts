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
import { BillingStatusEnum } from './billing-status.enum';
import { BillingRepository } from './billing.repository';
import { CreateBillingDto } from './dto/create-billing.dto';
import { PayBillingDto } from './dto/pay-billing.dto';

import dayjs from 'dayjs';
import { I18nContext, I18nService } from 'nestjs-i18n';
import * as path from 'path';
import { FilesService } from 'src/files/files.service';
import { generateBillingExcel, UltilityDetail } from './billing.util';
import { REDIS_PREFIX_KEY } from 'src/utils/constant';
import { createHash } from 'crypto';
import { GetBillingDto } from './dto/get-billing.dto';
import { BillingEntity } from './billing.entity';
import { FileEntity } from 'src/files/file.entity';

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
    });

    this.redisService.incr(`${this.CACHE_BILLING_VERSION_KEY}:${user.id}`);

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
    const targetBill = await this.repository.findById(id, user.id);
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
      const filePath = `${user.id}/${room.house.id}/${room.id}/billing/${dayjs(targetBill.from).format('MM-YYYY')}/${fileName}`;

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

    return targetBill;
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
    const lang = I18nContext.current()?.lang;

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
    const electricityUsage =
      dto.electricity_end_index - dto.electricity_start_index;
    const waterUsage = dto.water_end_index - dto.water_start_index;

    if (electricityUsage < 0 || waterUsage < 0) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          index: 'endIndexMustBeGreaterThanStartIndex',
        },
      });
    }

    const totalElectricityCost =
      Number(contract.fixed_electricity_fee) > 0
        ? Number(contract.fixed_electricity_fee)
        : electricityUsage * Number(contract.price_per_electricity_unit);

    const totalWaterCost =
      Number(contract.fixed_water_fee) > 0
        ? Number(contract.fixed_water_fee)
        : waterUsage * Number(contract.price_per_water_unit);

    const totalAmount =
      Number(contract.base_rent) +
      totalElectricityCost +
      totalWaterCost +
      Number(contract.internet_fee) +
      Number(contract.living_fee) +
      Number(contract.parking_fee) +
      Number(contract.cleaning_fee);

    let utilityDetails: UltilityDetail | null = null;

    if (Number(contract.price_per_electricity_unit) > 0) {
      utilityDetails = {
        electric_end_index: dto.electricity_end_index,
        electric_price_unit: contract.price_per_electricity_unit,
        electric_start_index: dto.electricity_start_index,
      };
    }

    if (Number(contract.price_per_water_unit) > 0) {
      const waterUltility = {
        water_start_index: dto.water_start_index,
        water_end_index: dto.water_end_index,
        water_price_unit: contract.price_per_water_unit,
      };
      utilityDetails = {
        ...utilityDetails,
        ...waterUltility,
      };
    }

    const billingItems = [
      {
        description: this.i18nService.t('billing.monthlyRent', { lang }),
        quantity: 1,
        unitPrice: contract.base_rent,
        amount: contract.base_rent,
      },
      {
        description: this.i18nService.t('billing.electricity', { lang }),
        quantity: Number(contract.fixed_electricity_fee) ? 1 : electricityUsage,
        unitPrice: Number(contract.fixed_electricity_fee)
          ? contract.fixed_electricity_fee
          : contract.price_per_electricity_unit,
        amount: totalElectricityCost,
      },
      {
        description: this.i18nService.t('billing.water', { lang }),
        quantity: Number(contract.fixed_water_fee) ? 1 : waterUsage,
        unitPrice: Number(contract.fixed_water_fee)
          ? contract.fixed_water_fee
          : contract.price_per_water_unit,
        amount: totalWaterCost,
      },
    ];

    if (contract.internet_fee) {
      billingItems.push({
        description: this.i18nService.t('billing.internetFee', { lang }),
        quantity: 1,
        unitPrice: contract.internet_fee,
        amount: contract.internet_fee,
      });
    }

    if (contract.cleaning_fee) {
      billingItems.push({
        description: this.i18nService.t('billing.cleaningFee', { lang }),
        quantity: 1,
        unitPrice: contract.cleaning_fee,
        amount: contract.cleaning_fee,
      });
    }

    if (contract.living_fee) {
      billingItems.push({
        description: this.i18nService.t('billing.livingFee', { lang }),
        quantity: 1,
        unitPrice: contract.living_fee,
        amount: contract.living_fee,
      });
    }

    if (contract.parking_fee) {
      billingItems.push({
        description: this.i18nService.t('billing.parkingFee', { lang }),
        quantity: 1,
        unitPrice: contract.parking_fee,
        amount: contract.parking_fee,
      });
    }

    // if (contract.overRentalFee) {
    //   billingItems.push({
    //     description: this.i18nService.t('billing.overRentalFee', { lang }),
    //     quantity: 1,
    //     unitPrice: Number(contract.overRentalFee),
    //     amount: Number(contract.overRentalFee),
    //   });
    // }

    const houseInfo: CreateBillingDto['houseInfo'] = {
      ...dto.houseInfo,
      houseAddress: room.house.address,
      houseOwner: room.house.owner.bankName,
      houseOwnerPhoneNumber: room.house.owner.phoneNumber,
    };

    const bankInfo: CreateBillingDto['bankInfo'] = {
      ...dto.bankInfo,
      bankAccountName: room.house.owner.bankAccountName,
      bankAccountNumber: room.house.owner.bankAccountNumber,
      bankName: room.house.owner.bankName,
    };

    const buffer = await generateBillingExcel(
      {
        room,
        contract,
        tenant,
        bankInfo: bankInfo,
        houseInfo: houseInfo,
        from: dto.from,
        to: dto.to,
        notes: dto.notes,
        utilityDetails,
        items: billingItems,
        totalAmount: totalAmount,
      },
      this.i18nService,
    );
    const fileName = `invoice-${room.name}-${Date.now()}.xlsx`;
    const filePath = `${user.id}/${room.house.id}/${room.id}/billing/${dayjs(dto.from).format('MM-YYYY')}/${fileName}`;

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
    const { room: roomId, ...options } = dto;
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
    const { room: roomId, ...options } = dto;
    const userId = user.id;

    const cacheVersion = await this.getCacheVersion(user.id);

    const hashKey = createHash('sha256')
      .update(
        JSON.stringify({
          ...options,
          roomId,
          userId,
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
        ...options,
      },
      ['tenantContract', 'tenantContract.tenant', 'tenantContract.contract'],
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
}
