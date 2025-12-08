import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import dayjs from 'dayjs';
import Docxtemplater from 'docxtemplater';
import * as fs from 'fs';
import * as path from 'path';
import PizZip from 'pizzip';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { FilesService } from 'src/files/files.service';
import { RoomEntity } from 'src/rooms/room.entity';
import { RoomsService } from 'src/rooms/rooms.service';
import { TenantEntity } from 'src/tenant/tenant.entity';
import { TenantService } from 'src/tenant/tenant.service';
import { UserEntity } from 'src/users/user.entity';
import { UserService } from 'src/users/users.service';
import { numberToVietnameseText } from 'src/utils/helper';
import { ContractsRepository } from './contracts.repository';
import { CreateContractDto } from './dtos/create-contract.dto';

import { cloneDeep } from 'lodash';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    private readonly contractsRepository: ContractsRepository,
    private readonly tenantService: TenantService,
    private readonly roomService: RoomsService,
    private readonly fileService: FilesService,
    private readonly userService: UserService,
  ) {}

  async create(
    contractData: CreateContractDto,
    userJwtPayload: JwtPayloadType,
  ) {
    const { owner, room, tenants } = await this.validate(
      contractData,
      userJwtPayload,
    );

    await this.generateAndSaveContract(owner, room, tenants, contractData);

    return {
      message: 'Contract created and saved successfully',
    };
  }

  generateContractData(
    owner: UserEntity,
    room: RoomEntity,
    tenants: TenantEntity[],
    contractPayload: CreateContractDto,
  ) {
    const { createdDate, houseInfo, bankInfo, startDate, endDate } =
      contractPayload;
    const {
      houseOwner,
      houseAddress,
      houseOwnerBackupPhoneNumber,
      houseOwnerPhoneNumber,
      overRentalFee,
    } = houseInfo;

    const { bankAccountName, bankAccountNumber, bankName } = bankInfo;

    const { house } = room;

    const firstTenant = tenants[0];

    const startDay = dayjs(startDate);
    const endDay = dayjs(endDate);

    const duration = dayjs(endDay).diff(startDay, 'month');

    // Calculate pricing
    const roomPrice = Number(room.base_rent);
    const roomDeposit = roomPrice; // Assuming deposit equals one month rent
    const roomFirstMonthTotal = roomPrice + roomDeposit;

    const tenantsData = cloneDeep(tenants).map((elm) => {
      return {
        name: elm.name || 'N/A',
        phone: elm.phoneNumber || 'N/A',
        citizenId: elm.citizenId || 'N/A',
        citizenIdCreatedAt: elm.issueDate
          ? dayjs(elm.issueDate).format('[Ngày] DD [tháng] MM [năm] YYYY')
          : 'N/A',
        citizenIdCreatedBy: elm.issueLoc || 'N/A',
        citizenIdAddress: elm.address || 'N/A',
      };
    });

    const roomElectricFee =
      room.price_per_electricity_unit > 0
        ? `${Number(room.price_per_electricity_unit).toLocaleString('vi-VN')} đồng/kwh`
        : `${Number(room.fixed_electricity_fee).toLocaleString('vi-VN')} đồng/người`;

    const contractData = {
      createdDay: dayjs(createdDate).format('DD'),
      createdMonth: dayjs(createdDate).format('MM'),
      createdYear: dayjs(createdDate).format('YYYY'),
      houseOwner: houseOwner || `${owner.lastName} ${owner.firstName}`,
      houseAddress: houseAddress || house.address,
      houseOwnerPhoneNumber: houseOwnerPhoneNumber || owner.phoneNumber,
      houseOwnerBackupPhoneNumber: houseOwnerBackupPhoneNumber,
      bankAccountName: bankAccountName || owner.bankAccountName,
      bankAccountNumber: bankAccountNumber || owner.bankAccountNumber,
      bankName: bankName || owner.bankName,

      mainTenantName: firstTenant.name,
      mainTenantPhone: firstTenant.phoneNumber,
      mainTenantCitizenIdAddress: firstTenant.address,
      mainTenantCitizenId: firstTenant.citizenId,
      mainTenantCitizenIdCreatedAt: firstTenant.issueDate
        ? dayjs(firstTenant.issueDate).format('[Ngày] DD [tháng] MM [năm] YYYY')
        : 'N/A',
      mainTenantCitizenIdCreatedBy: firstTenant.issueLoc,
      mainTenantJob: firstTenant.tenantJob,
      mainTenantWorkAt: firstTenant.tenantWorkAt,

      tenants: tenantsData,
      totalTenant: String(tenants.length).padStart(2, '0'),

      overRentalFee: Number(
        overRentalFee || house.overRentalFee || 0,
      ).toLocaleString('vi-VN'),

      roomName: room.name,
      roomPrice: roomPrice.toLocaleString('vi-VN'),
      roomPriceInText: numberToVietnameseText(roomPrice),
      roomDeposit: roomDeposit.toLocaleString('vi-VN'),
      roomDepositInText: numberToVietnameseText(roomDeposit),
      roomFirstMonthTotal: roomFirstMonthTotal.toLocaleString('vi-VN'),
      roomFirstMonthTotalInText: numberToVietnameseText(roomFirstMonthTotal),
      roomElectricFee: roomElectricFee,
      roomInternetFee: `${Number(room.internet_fee).toLocaleString('vi-VN')} đồng/phòng`,
      roomWaterFee: `${Number(room.fixed_water_fee).toLocaleString('vi-VN')} đồng/người`,
      roomCleaningFee: `${Number(room.cleaning_fee).toLocaleString('vi-VN')} đồng/người`,
      roomWaterByMeter: `${Number(room.price_per_water_unit).toLocaleString('vi-VN')} đồng/m³`,
      roomLivingExpense: `${Number(room.living_fee).toLocaleString('vi-VN')} đồng/người`,

      startDate: startDay.format('[Ngày] DD [tháng] MM [năm] YYYY'),
      endDate: endDay.format('[Ngày] DD [tháng] MM [năm] YYYY'),
      duration,
    };

    Object.keys(contractData).forEach((key) => {
      if (!contractData[key]) {
        contractData[key] = 'N/A';
      }
    });

    return contractData;
  }

  async generateAndSaveContract(
    owner: UserEntity,
    room: RoomEntity,
    tenants: TenantEntity[],
    contractPayload: CreateContractDto,
  ): Promise<{ buffer: Buffer; file: any }> {
    const result = await this.generateContract(
      owner,
      room,
      tenants,
      contractPayload,
    );
    if (!result.file) {
      throw new BadRequestException('Failed to save contract file');
    }
    return result as { buffer: Buffer; file: any };
  }

  async generateContract(
    owner: UserEntity,
    room: RoomEntity,
    tenants: TenantEntity[],
    contractPayload: CreateContractDto,
  ): Promise<{ buffer: Buffer; file?: any }> {
    try {
      // Get contract data
      const contractData = await this.generateContractData(
        owner,
        room,
        tenants,
        contractPayload,
      );

      // Read the template file
      const templatePath = path.join(
        process.cwd(),
        'src',
        'contracts',
        'templates',
        'rental-house-contract-template.docx',
      );

      if (!fs.existsSync(templatePath)) {
        throw new BadRequestException(
          'Contract template not found. Please ensure the template file exists at: src/contracts/templates/rental-house-contract-template.docx',
        );
      }

      const content = fs.readFileSync(templatePath, 'binary');

      // Create a new zip instance
      const zip = new PizZip(content);

      // Create docxtemplater instance
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Render the document with template variables
      doc.render(contractData);

      // Generate the document buffer
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      const file = await this.saveContractToMinio(
        buffer,
        contractData,
        owner.id,
        room,
      );

      return { buffer, file };
    } catch (error) {
      if (error.properties && error.properties.errors instanceof Array) {
        const errorMessages = error.properties.errors
          .map((e: any) => e.properties.explanation)
          .join(', ');
        throw new BadRequestException(`Template error: ${errorMessages}`);
      }
      throw new BadRequestException(
        `Failed to generate contract: ${error.message}`,
      );
    }
  }

  private async saveContractToMinio(
    buffer: Buffer,
    contractData: any,
    ownerId: string,
    room: RoomEntity,
  ): Promise<any> {
    try {
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `contract-${timestamp}.docx`;
      const filePath = `${ownerId}/${room.house.id}/${room.id}/${fileName}`;

      // Upload to Minio
      const savedFile = await this.fileService.uploadBufferWithCustomPath(
        buffer,
        filePath,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileName,
        ownerId,
      );

      this.logger.log(`Contract saved to Minio: ${savedFile.path}`);
      return savedFile;
    } catch (error) {
      this.logger.error(`Failed to save contract file: ${error.message}`);
      throw new BadRequestException(
        `Failed to save contract file: ${error.message}`,
      );
    }
  }

  async validate(
    contractData: CreateContractDto,
    userJwtPayload: JwtPayloadType,
  ) {
    const { roomId, tenants } = contractData;

    const owner = await this.userService.findById(userJwtPayload.id);
    if (!owner) {
      this.logger.error(`[logMsg]`);
      throw new UnprocessableEntityException({
        status: HttpStatus.BAD_REQUEST,
        message: '[errMsg]',
      });
    }

    const room = await this.roomService.findById(roomId, owner.id);
    if (!room) {
      this.logger.error(`[logMsg]`);
      throw new UnprocessableEntityException({
        status: HttpStatus.BAD_REQUEST,
        message: '[errMsg]',
      });
    }

    const listTenants: TenantEntity[] = [];
    const getTenantsPromises: Promise<TenantEntity | null>[] = [];

    tenants.forEach((elm) => {
      getTenantsPromises.push(this.tenantService.findById(elm, ['room']));
    });

    const responseTenants = await Promise.allSettled(getTenantsPromises);
    responseTenants.forEach((res) => {
      if (res.status === 'rejected' || !res.value) {
        throw new UnprocessableEntityException({
          status: HttpStatus.BAD_REQUEST,
          message: '[errMsg]',
        });
      }

      if (res.value.room.id !== room.id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.BAD_REQUEST,
          message: '[errMsg]',
        });
      }

      listTenants.push(res.value);
    });

    return {
      owner,
      room,
      tenants: listTenants,
    };
  }
}
