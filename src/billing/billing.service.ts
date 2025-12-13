import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { RedisService } from 'src/redis/redis.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { TenantService } from 'src/tenant/tenant.service';
import { BillingStatusEnum } from './billing-status.enum';
import { BillingRepository } from './billing.repository';
import { CreateBillingDto } from './dto/create-billing.dto';
import { ContractsService } from 'src/contracts/contracts.service';
import { RoomEntity } from 'src/rooms/room.entity';
import { TenantContractsService } from 'src/tenant-contracts/tenant-contracts.service';
import { StatusEnum } from 'src/statuses/statuses.enum';

import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs/promises';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { generateBillingExcel, UltilityDetail } from './billing.util';
import { FilesService } from 'src/files/files.service';
import dayjs from 'dayjs';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly CACHE_BILLING_TTL = 60 * 5; // 5 minutes
  private readonly outputDir: string;

  constructor(
    private readonly repository: BillingRepository,
    private readonly roomService: RoomsService,
    private readonly tenantContractService: TenantContractsService,
    private readonly redisService: RedisService,
    private readonly i18nService: I18nService,
    private readonly fileService: FilesService,
  ) {
    this.outputDir = path.join(process.cwd(), 'generated-invoices');
  }

  async create(dto: CreateBillingDto, user: JwtPayloadType) {
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

    console.log('[ROOM:]', room);

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

    // return result;
    await this.ensureOutputDirectory();

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
    const filePath = `${user.id}/${room.house.id}/${room.id}/billing/${dayjs().format('MM-YYYY')}/${fileName}`;

    const file = await this.fileService.uploadBufferWithCustomPath(
      buffer,
      filePath,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName,
      user.id,
    );

    const result = await this.repository.create({
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

    return result;
  }

  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  async saveToFile(data: any, filename?: string): Promise<string> {
    await this.ensureOutputDirectory();

    const buffer = await generateBillingExcel(data, this.i18nService);
    const fileName =
      filename || `invoice-${data.invoiceNumber}-${Date.now()}.xlsx`;
    const filePath = path.join(this.outputDir, fileName);

    await fs.writeFile(filePath, buffer);
    return filePath;
  }
}
