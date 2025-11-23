import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ContractsRepository } from './contracts.repository';
import { ContractEntity } from './contract.entity';
import { CreateContractDto } from './dtos/create-contract.dto';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { TenantService } from 'src/tenant/tenant.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { FilesService } from 'src/files/files.service';
import { UserService } from 'src/users/users.service';
import { numberToVietnameseText } from 'src/utils/helper';
import dayjs from 'dayjs';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import * as fs from 'fs';
import * as path from 'path';

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
    const result = await this.generateAndSaveContract(
      contractData.roomId,
      contractData.tenantId,
      userJwtPayload.id,
    );

    // Create contract entity and save to database
    const contract = await this.contractsRepository.create({
      owner: { id: userJwtPayload.id } as any,
      tenant: { id: contractData.tenantId } as any,
      room: { id: contractData.roomId } as any,
      file: result.file,
    });

    return {
      contract,
      file: result.file,
      message: 'Contract created and saved successfully',
    };
  }

  async generateContractData(
    roomId: string,
    tenantId: string,
    ownerId: string,
  ) {
    const currentUser = await this.userService.findById(ownerId);
    this.logger.log(
      `Retrieved current user: ${currentUser?.id || 'not found'}`,
    );

    if (!currentUser) {
      this.logger.error(`User not found with ID: ${ownerId}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    // Validate tenant exists
    const tenant = await this.tenantService.findById(tenantId);
    this.logger.log(`Retrieved tenant: ${tenant?.id || 'not found'}`);

    if (!tenant) {
      this.logger.error(`Tenant not found with ID: ${tenantId}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          tenant: 'tenantNotFound',
        },
      });
    }

    // Validate room exists
    const room = await this.roomService.findById(roomId, ownerId);
    this.logger.log(`Retrieved room: ${room?.id || 'not found'}`);

    if (!room) {
      this.logger.error(`Room not found with ID: ${roomId}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          room: 'roomNotFound',
        },
      });
    }

    // Calculate contract dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);

    // Calculate pricing
    const roomPrice = Number(room.base_rent);
    const roomDeposit = roomPrice; // Assuming deposit equals one month rent
    const roomFirstMonthTotal = roomPrice + roomDeposit;

    // Build contract data
    const contractData = {
      // Primary tenant info
      tenantName: tenant.name,
      tenantPhone: 'Chưa cập nhật', // Will be added to tenant entity later
      tenantCitizenId: 'Chưa cập nhật',
      tenantCitizenIdCreatedAt: 'Chưa cập nhật',
      tenantCitizenIdCreatedBy: 'Chưa cập nhật',
      tenantCitizenIdAddress: tenant.address || 'Chưa cập nhật',
      tenantJob: 'Chưa cập nhật',
      tenantWorkAt: 'Chưa cập nhật',

      // Additional tenants
      tenantA: tenant.name || 'Không có',
      tenantAPhone: 'Chưa cập nhật',
      tenantACitizenId: 'Chưa cập nhật',
      tenantACitizenIdCreatedAt: 'Chưa cập nhật',
      tenantACitizenIdCreatedBy: 'Chưa cập nhật',
      tenantACitizenIdAddress: tenant.address || 'Chưa cập nhật',

      tenantB: tenant.name || 'Không có',
      tenantBPhone: 'Chưa cập nhật',
      tenantBCitizenId: 'Chưa cập nhật',
      tenantBCitizenIdCreatedAt: 'Chưa cập nhật',
      tenantBCitizenIdCreatedBy: 'Chưa cập nhật',
      tenantBCitizenIdAddress: tenant.address || 'Chưa cập nhật',

      // Room and pricing info
      roomPrice: roomPrice.toLocaleString('vi-VN'),
      roomPriceInText: numberToVietnameseText(roomPrice),
      roomDeposit: roomDeposit.toLocaleString('vi-VN'),
      roomDepositInText: numberToVietnameseText(roomDeposit),
      roomFirstMonthTotal: roomFirstMonthTotal.toLocaleString('vi-VN'),
      roomFirstMonthTotalInText: numberToVietnameseText(roomFirstMonthTotal),
      roomElectricFee: Number(
        room.price_per_electricity_unit || room.fixed_electricity_fee,
      ).toLocaleString('vi-VN'),
      roomInternetFee: '100,000', // Fixed value, will be configurable later
      roomWaterFee: Number(
        room.price_per_water_unit || room.fixed_water_fee,
      ).toLocaleString('vi-VN'),
      roomCleaningFee: Number(room.cleaning_fee).toLocaleString('vi-VN'),
      roomWaterByMeter: '25,000', // Fixed value
      roomLivingExpense: Number(room.living_fee).toLocaleString('vi-VN'),

      // Contract dates
      contractStartDate: dayjs(startDate).format('DD/MM/YYYY'),
      contractEndDate: dayjs(endDate).format('DD/MM/YYYY'),
      contractSignDate: dayjs().format('DD/MM/YYYY'),

      // Property info
      propertyAddress:
        'Số 16, Ngõ 66 Đường Giáp Bát, Phường Giáp Bát, Quận Hoàng Mai, TP Hà Nội',
      roomNumber: room.name,
    };

    return contractData;
  }

  async generateAndSaveContract(
    roomId: string,
    tenantId: string,
    ownerId: string,
  ): Promise<{ buffer: Buffer; file: any }> {
    const result = await this.generateContract(roomId, tenantId, ownerId, true);
    if (!result.file) {
      throw new BadRequestException('Failed to save contract file');
    }
    return result as { buffer: Buffer; file: any };
  }

  async generateContract(
    roomId: string,
    tenantId: string,
    ownerId: string,
    saveToFile: boolean = false,
  ): Promise<{ buffer: Buffer; file?: any }> {
    try {
      // Get contract data
      const contractData = await this.generateContractData(
        roomId,
        tenantId,
        ownerId,
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

      let file: any;

      if (saveToFile) {
        file = await this.saveContractToMinio(buffer, contractData, ownerId);
      }

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
  ): Promise<any> {
    try {
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `contract-${contractData.tenantName}-${contractData.roomNumber}-${timestamp}.docx`;

      // Upload to Minio
      const savedFile = await this.fileService.uploadBuffer(
        buffer,
        fileName,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

  async findAll(): Promise<ContractEntity[]> {
    return await this.contractsRepository.findAll();
  }

  async findById(id: string): Promise<ContractEntity> {
    const contract = await this.contractsRepository.findById(id);
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }
    return contract;
  }

  async findByTenant(tenantId: string): Promise<ContractEntity[]> {
    return await this.contractsRepository.findByTenant(tenantId);
  }

  async findByOwner(ownerId: string): Promise<ContractEntity[]> {
    return await this.contractsRepository.findByOwner(ownerId);
  }

  async findByRoom(roomId: string): Promise<ContractEntity[]> {
    return await this.contractsRepository.findByRoom(roomId);
  }

  async findByFile(fileId: string): Promise<ContractEntity | null> {
    return await this.contractsRepository.findByFile(fileId);
  }

  async findByStatus(statusId: string): Promise<ContractEntity[]> {
    return await this.contractsRepository.findByStatus(statusId);
  }

  async update(
    id: string,
    updateData: Partial<ContractEntity>,
  ): Promise<ContractEntity> {
    const contract = await this.contractsRepository.update(id, updateData);
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }
    return contract;
  }

  async softDelete(id: string): Promise<boolean> {
    const deleted = await this.contractsRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }
    return deleted;
  }

  async restore(id: string): Promise<boolean> {
    const restored = await this.contractsRepository.restore(id);
    if (!restored) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }
    return restored;
  }

  async count(): Promise<number> {
    return await this.contractsRepository.count();
  }
}
