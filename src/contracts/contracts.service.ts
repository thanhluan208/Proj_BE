import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import dayjs, { convertToUTC, convertFromUTC } from 'src/utils/date-utils';
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
import { FileEntity } from 'src/files/file.entity';
import { ContractEntity } from './contract.entity';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { StatusEntity } from 'src/statuses/status.entity';
import { RedisService } from 'src/redis/redis.service';
import { REDIS_PREFIX_KEY } from 'src/utils/constant';
import { TenantContractsService } from 'src/tenant-contracts/tenant-contracts.service';
import { TenantContractEntity } from 'src/tenant-contracts/tenant-contracts.entity';
import { CreateTenantContractDto } from 'src/tenant-contracts/dto/create-tenant-contract.dto';
import { createHash } from 'crypto';
import { DataSource } from 'typeorm';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(RoomsService.name);
  private readonly CACHE_CONTRACT_TTL = 60 * 5; // Cache for 5 minutes
  private readonly CACHE_CONTRACT_VERSION_KEY = `${REDIS_PREFIX_KEY.contract}:version`;
  private readonly CACHED_KEY = {
    findActiveContractByRoom: 'findActiveContractByRoom',
    getTotalContractByRoom: 'getTotalContractByRoom',
    findById: 'findById',
  };

  constructor(
    private redisService: RedisService,
    private readonly dataSource: DataSource,
    private readonly contractsRepository: ContractsRepository,
    private readonly tenantService: TenantService,
    private readonly roomService: RoomsService,
    private readonly fileService: FilesService,
    private readonly userService: UserService,
    private readonly tenantContractsService: TenantContractsService,
  ) {}

  async create(
    contractData: CreateContractDto,
    userJwtPayload: JwtPayloadType,
    timezone: string = 'UTC',
  ) {
    // Convert dates to UTC based on user's timezone
    contractData.createdDate = convertToUTC(
      contractData.createdDate,
      timezone,
    )?.toISOString() as string;
    contractData.startDate = convertToUTC(
      contractData.startDate,
      timezone,
    )?.toISOString() as string;
    contractData.endDate = convertToUTC(
      contractData.endDate,
      timezone,
    )?.toISOString() as string;

    const { owner, room, tenants } = await this.validate(
      contractData,
      userJwtPayload,
    );

    const activeContract =
      await this.contractsRepository.findActiveContractByRoom(room.id);
    if (activeContract) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Only one active contract per room at a time allowed!',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const { file } = await this.generateAndSaveContract(
        owner,
        room,
        tenants,
        contractData,
      );
      await manager.save(file);

      const newContract = await this.contractsRepository.create({
        room: {
          id: room.id,
        } as RoomEntity,
        file: file,
        status: {
          id: StatusEnum.active,
        } as StatusEntity,
        createdDate: dayjs(contractData.createdDate).toDate(),
        endDate: dayjs(contractData.endDate).toDate(),
        startDate: dayjs(contractData.startDate).toDate(),
        ...contractData.feeInfo,
      });
      await manager.save(newContract);

      const createTenantContractQueue: Promise<TenantContractEntity>[] = [];

      tenants.forEach((tent, index) => {
        createTenantContractQueue.push(
          this.tenantContractsService.create(
            {
              contractId: newContract.id,
              tenantId: tent.id,
              isMainTenant: index === 0,
            },
            userJwtPayload.id,
          ),
        );
      });

      await Promise.all(createTenantContractQueue);

      return this.formatContractResponse(newContract, timezone);
    });
  }

  async delete(id: string, userJwtPayload: JwtPayloadType) {
    const contract = await this.findById(id, userJwtPayload.id, [
      'room',
      'room.house',
      'room.house.owner',
    ]);

    if (!contract) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Contract not found',
      });
    }

    if (contract.room.house.owner.id !== userJwtPayload.id) {
      throw new BadRequestException({
        status: HttpStatus.FORBIDDEN,
      });
    }

    await this.tenantContractsService.removeByContract(contract.id);

    await this.contractsRepository.softDelete(id);

    await this.redisService.incr(
      `${this.CACHE_CONTRACT_VERSION_KEY}:${userJwtPayload.id}`,
    );

    return this.formatContractResponse(contract, 'UTC');
  }

  async updateMainTenantContract(
    payload: CreateTenantContractDto,
    userJwtPayload: JwtPayloadType,
  ) {
    const { contractId, tenantId } = payload;

    const contract = await this.findById(contractId, userJwtPayload.id, [
      'room',
      'room.house',
      'room.house.owner',
    ]);
    if (!contract) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No contract found',
      });
    }
    const tenant = await this.tenantService.findById(tenantId, [
      'room',
      'room.house',
      'room.house.owner',
    ]);
    if (!tenant) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No tenant found',
      });
    }

    if (
      contract.room.house.owner.id !== userJwtPayload.id ||
      tenant.room.house.owner.id !== userJwtPayload.id
    ) {
      throw new BadRequestException({
        status: HttpStatus.FORBIDDEN,
      });
    }

    const updated = await this.tenantContractsService.updateMainTenant(
      {
        contractId,
        tenantId,
      },
      userJwtPayload.id,
    );

    if (!updated) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Update failed',
      });
    }

    return updated;
  }

  async getActiveContractByRoom(
    roomId: string,
    userId: string,
    relations?: string[],
  ) {
    const cacheVersion =
      (await this.redisService.get(
        `${this.CACHE_CONTRACT_VERSION_KEY}:${userId}`,
      )) ?? '0';

    const sortedRelations = (relations || [])?.sort().join(',');
    const hashRelations = createHash('sha256')
      .update(sortedRelations)
      .digest('hex');

    const cachedKey = `${this.CACHED_KEY.findActiveContractByRoom}:${roomId}:${hashRelations}:${cacheVersion}`;

    const room = await this.roomService.findById(roomId, userId);
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: '[msg]',
      });
    }

    let contract = await this.redisService.get(cachedKey).then((res) => {
      if (res) {
        return JSON.parse(res) as ContractEntity;
      } else {
        return null;
      }
    });

    if (contract) return contract;

    contract = await this.contractsRepository.findOneByRoom(
      roomId,
      StatusEnum.active,
      relations,
    );
    await this.redisService.set(
      cachedKey,
      JSON.stringify(contract),
      this.CACHE_CONTRACT_TTL,
    );

    return contract;
  }

  async findContractsByRoom(
    roomId: string,
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
      status?: string;
    },
    timezone: string = 'UTC',
  ) {
    const cacheVersion =
      (await this.redisService.get(
        `${this.CACHE_CONTRACT_VERSION_KEY}:${userId}`,
      )) ?? '0';

    const room = await this.roomService.findById(roomId, userId);
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: '[msg]',
      });
    }

    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const hashKey = createHash('sha256')
      .update(
        JSON.stringify({
          ...options,
          roomId,
          userId,
        }),
      )
      .digest('hex');

    const cacheKey = `${REDIS_PREFIX_KEY.room}:${hashKey}:v${cacheVersion}`;

    let contracts: ContractEntity[] = [];

    const cachedContracts = await this.redisService.get(cacheKey);
    if (cachedContracts) {
      contracts = JSON.parse(cachedContracts);
    } else {
      this.logger.log(`Contracts not found in cache for house ID: ${roomId}`);
      // Get rooms
      contracts = (await this.contractsRepository.findByRoom(roomId, {
        skip,
        take: pageSize,
        status: options.status || 'active',
      })) as ContractEntity[];
      if (contracts.length > 0 && contracts?.length === pageSize) {
        await this.redisService.set(
          cacheKey,
          JSON.stringify(contracts),
          this.CACHE_CONTRACT_TTL,
        );
      }
    }

    const formattedContracts = contracts.map((contract) =>
      this.formatContractResponse(contract, timezone),
    );

    return {
      data: formattedContracts,
      page,
      pageSize,
    };
  }

  private formatContractResponse(
    contract: ContractEntity,
    timezone: string,
  ): ContractEntity {
    if (contract.createdDate) {
      contract.createdDate = convertFromUTC(
        contract.createdDate,
        timezone,
      ) as any;
    }
    if (contract.startDate) {
      contract.startDate = convertFromUTC(contract.startDate, timezone) as any;
    }
    if (contract.endDate) {
      contract.endDate = convertFromUTC(contract.endDate, timezone) as any;
    }
    return contract;
  }

  async getTotalContractByRoom(
    roomId: string,
    userId: string,
    options: {
      status?: string;
    },
  ) {
    const cacheVersion =
      (await this.redisService.get(
        `${this.CACHE_CONTRACT_VERSION_KEY}:${userId}`,
      )) ?? '0';

    const hashKey = createHash('sha256')
      .update(
        JSON.stringify({
          ...options,
          roomId,
          userId,
        }),
      )
      .digest('hex');

    const cachedKey = `${this.CACHED_KEY.getTotalContractByRoom}:${hashKey}:${cacheVersion}`;

    let total = 0;
    const cachedTotal = await this.redisService.get(cachedKey);
    if (cachedTotal) {
      return {
        total: Number(JSON.parse(cachedTotal)),
      };
    }

    const room = await this.roomService.findById(roomId, userId);
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: '[msg]',
      });
    }

    total = (await this.contractsRepository.findByRoom(roomId, {
      isCounting: true,
      ...options,
    })) as number;

    if (total > 0) {
      await this.redisService.set(
        cachedKey,
        JSON.stringify(total),
        this.CACHE_CONTRACT_TTL,
      );
    }

    return {
      total,
    };
  }

  async findById(id: string, userId: string, relations?: string[]) {
    const cacheVersion =
      (await this.redisService.get(
        `${this.CACHE_CONTRACT_VERSION_KEY}:${userId}`,
      )) ?? '0';

    const sortedRelations = (relations || [])?.sort().join(',');
    const hashRelations = createHash('sha256')
      .update(sortedRelations)
      .digest('hex');

    const cachedKey = `${this.CACHED_KEY.findById}:${id}:${hashRelations}:${cacheVersion}`;

    const cachedData = await this.redisService.get(cachedKey);
    if (cachedData) {
      return JSON.parse(cachedData) as ContractEntity;
    }

    const queryData = await this.contractsRepository.findById(id, relations);
    if (queryData) {
      await this.redisService.set(
        cachedKey,
        JSON.stringify(queryData),
        this.CACHE_CONTRACT_TTL,
      );

      return queryData;
    }
  }

  generateContractData(
    owner: UserEntity,
    room: RoomEntity,
    tenants: TenantEntity[],
    contractPayload: CreateContractDto,
  ) {
    const { createdDate, houseInfo, bankInfo, startDate, endDate, feeInfo } =
      contractPayload;
    const {
      houseOwner,
      houseAddress,
      houseOwnerBackupPhoneNumber,
      houseOwnerPhoneNumber,
    } = houseInfo;

    const { bankAccountName, bankAccountNumber, bankName } = bankInfo;

    const { house } = room;

    const firstTenant = tenants[0];

    const startDay = dayjs(startDate);
    const endDay = dayjs(endDate);

    const duration = dayjs(endDay).diff(startDay, 'month');

    // Calculate pricing
    const roomPrice = Number(feeInfo.base_rent);
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
      feeInfo.price_per_electricity_unit &&
      feeInfo.price_per_electricity_unit > 0
        ? `${Number(feeInfo.price_per_electricity_unit).toLocaleString('vi-VN')} đồng/kwh`
        : `${Number(feeInfo.fixed_electricity_fee).toLocaleString('vi-VN')} đồng/người`;

    const contractData = {
      createdDay: dayjs(createdDate).format('DD'),
      createdMonth: dayjs(createdDate).format('MM'),
      createdYear: dayjs(createdDate).format('YYYY'),
      houseOwner: houseOwner || `${owner.fullName} `,
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

      overRentalFee: Number(feeInfo.overRentalFee || 0).toLocaleString('vi-VN'),

      roomName: room.name,
      roomPrice: roomPrice.toLocaleString('vi-VN'),
      roomPriceInText: numberToVietnameseText(roomPrice),
      roomDeposit: roomDeposit.toLocaleString('vi-VN'),
      roomDepositInText: numberToVietnameseText(roomDeposit),
      roomFirstMonthTotal: roomFirstMonthTotal.toLocaleString('vi-VN'),
      roomFirstMonthTotalInText: numberToVietnameseText(roomFirstMonthTotal),
      roomElectricFee: roomElectricFee,
      roomInternetFee: `${Number(feeInfo.internet_fee).toLocaleString('vi-VN')} đồng/phòng`,
      roomWaterFee: `${Number(feeInfo.fixed_water_fee).toLocaleString('vi-VN')} đồng/người`,
      roomCleaningFee: `${Number(feeInfo.cleaning_fee).toLocaleString('vi-VN')} đồng/người`,
      roomWaterByMeter: `${Number(feeInfo.price_per_water_unit).toLocaleString('vi-VN')} đồng/m³`,
      roomLivingExpense: `${Number(feeInfo.living_fee).toLocaleString('vi-VN')} đồng/người`,

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
  ): Promise<{ buffer: Buffer; file: FileEntity }> {
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
      const contractData = this.generateContractData(
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
  ): Promise<FileEntity> {
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
    const { roomId, tenants, feeInfo } = contractData;

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

    if (!feeInfo) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: '[msg]',
      });
    }

    // Validation
    const {
      price_per_electricity_unit = 0,
      fixed_electricity_fee = 0,
      price_per_water_unit = 0,
      fixed_water_fee = 0,
      base_rent,
      living_fee,
      parking_fee,
      cleaning_fee,
      internet_fee,
    } = feeInfo;

    if (
      Number(price_per_electricity_unit) <= 0 &&
      Number(fixed_electricity_fee) <= 0
    ) {
      throw new BadRequestException(
        'Either price_per_electricity_unit or fixed_electricity_fee must be greater than 0',
      );
    }

    if (Number(price_per_water_unit) <= 0 && Number(fixed_water_fee) <= 0) {
      throw new BadRequestException(
        'Either price_per_water_unit or fixed_water_fee must be greater than 0',
      );
    }

    if (Number(base_rent) <= 0) {
      throw new BadRequestException('base_rent must be greater than 0');
    }

    if (living_fee !== undefined && Number(living_fee) < 0) {
      throw new BadRequestException('living_fee must be positive number');
    }

    if (parking_fee !== undefined && Number(parking_fee) < 0) {
      throw new BadRequestException('parking_fee must be positive number');
    }

    if (cleaning_fee !== undefined && Number(cleaning_fee) < 0) {
      throw new BadRequestException('cleaning_fee must be positive number');
    }

    if (internet_fee !== undefined && Number(internet_fee) < 0) {
      throw new BadRequestException('internet_fee must be positive number');
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
