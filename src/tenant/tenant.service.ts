import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { FilesService } from 'src/files/files.service';
import { HousesService } from 'src/houses/houses.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { StatusEntity } from 'src/statuses/status.entity';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { UserService } from 'src/users/users.service';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { VisionService } from 'src/vision/vision.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { GetTenantDto } from './dto/get-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantEntity } from './tenant.entity';
import { TenantHelper } from './tenant.helper';
import { TenantRepository } from './tenant.repository';
import dayjs, { convertToUTC, convertFromUTC } from 'src/utils/date-utils';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';
import archiver from 'archiver';
import { Readable } from 'stream';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private readonly housesService: HousesService,
    private readonly roomsService: RoomsService,
    private readonly usersService: UserService,
    private readonly tenantRepository: TenantRepository,
    private readonly visionService: VisionService,
    private readonly filesService: FilesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createTenantDto: CreateTenantDto,
    userJwtPayload: JwtPayloadType,
    timezone: string = 'UTC',
  ) {
    const currentUser = await this.usersService.findById(userJwtPayload.id);
    this.logger.log(
      `Retrieved current user: ${currentUser?.id || 'not found'}`,
    );

    if (!currentUser) {
      this.logger.error(`User not found with ID: ${userJwtPayload.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    this.logger.log(
      `Checking if house exists with ID: ${createTenantDto.house}`,
    );
    const house = await this.housesService.findById(
      createTenantDto.house,
      currentUser.id,
    );

    if (!house) {
      this.logger.error(`House not found with ID: ${createTenantDto.house}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          house: 'houseNotFound',
        },
      });
    }

    this.logger.log(`House found with ID: ${house.id}, checking ownership`);
    this.logger.log(
      `House owner ID: ${house.owner?.id}, Current user ID: ${currentUser.id}`,
    );

    if (house.owner?.id !== currentUser.id) {
      this.logger.error(
        `User ${currentUser.id} is not the owner of house ${house.id}`,
      );
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          house: 'notHouseOwner',
        },
      });
    }

    this.logger.log(`Checking if room exists with ID: ${createTenantDto.room}`);
    const room = await this.roomsService.findById(
      createTenantDto.room,
      currentUser.id,
    );

    if (!room) {
      this.logger.error(`Room not found with ID: ${createTenantDto.room}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          room: 'roomNotFound',
        },
      });
    }

    this.logger.log(
      `Room found with ID: ${room.id}, checking if it belongs to house`,
    );
    this.logger.log(
      `Room house ID: ${room.house?.id}, Expected house ID: ${house.id}`,
    );

    if (room.house?.id !== house.id) {
      this.logger.error(`Room ${room.id} does not belong to house ${house.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          room: 'roomNotInHouse',
        },
      });
    }

    this.logger.log(
      `All validations passed. Creating tenant for room: ${room.id}`,
    );

    const tenant = await this.tenantRepository.create({
      room: room,
      name: createTenantDto.name,
      dob: createTenantDto.dob
        ? (convertToUTC(createTenantDto.dob, timezone) as Date)
        : undefined,
      address: createTenantDto.address,
      phoneNumber: createTenantDto.phoneNumber,
      citizenId: createTenantDto.citizenId,
      sex: createTenantDto.sex,
      nationality: createTenantDto.nationality,
      home: createTenantDto.home,
      issueDate: createTenantDto.issueDate
        ? (convertToUTC(createTenantDto.issueDate, timezone) as Date)
        : undefined,
      issueLoc: createTenantDto.issueLoc,
      tenantJob: createTenantDto.tenantJob,
      tenantWorkAt: createTenantDto.tenantWorkAt,
      status: {
        id: StatusEnum.active,
      } as StatusEntity,
    });

    // Create folder for tenant
    await this.filesService.createFolder(`${house.id}/${room.id}/${tenant.id}`);

    this.logger.log(`Tenant created successfully with ID: ${tenant.id}`);
    return this.formatTenantResponse(tenant, timezone);
  }

  async update(
    tenantId: string,
    updateTenantDto: UpdateTenantDto,
    userJwtPayload: JwtPayloadType,
    timezone: string = 'UTC',
  ) {
    this.logger.log(`Updating tenant with ID: ${tenantId}`);

    // Validate user and tenant ownership
    const { tenant } = await TenantHelper.validateUserAndTenantOwnership(
      this.usersService,
      this.tenantRepository,
      userJwtPayload,
      tenantId,
    );

    // Update tenant fields
    if (updateTenantDto.name !== undefined) {
      tenant.name = updateTenantDto.name;
    }
    if (updateTenantDto.dob !== undefined) {
      tenant.dob = updateTenantDto.dob
        ? (convertToUTC(updateTenantDto.dob, timezone) as Date)
        : undefined;
    }
    if (updateTenantDto.address !== undefined) {
      tenant.address = updateTenantDto.address;
    }
    if (updateTenantDto.phoneNumber !== undefined) {
      tenant.phoneNumber = updateTenantDto.phoneNumber;
    }
    if (updateTenantDto.citizenId !== undefined) {
      tenant.citizenId = updateTenantDto.citizenId;
    }
    if (updateTenantDto.sex !== undefined) {
      tenant.sex = updateTenantDto.sex;
    }
    if (updateTenantDto.nationality !== undefined) {
      tenant.nationality = updateTenantDto.nationality;
    }
    if (updateTenantDto.home !== undefined) {
      tenant.home = updateTenantDto.home;
    }
    if (updateTenantDto.issueDate !== undefined) {
      tenant.issueDate = updateTenantDto.issueDate
        ? (convertToUTC(updateTenantDto.issueDate, timezone) as Date)
        : undefined;
    }
    if (updateTenantDto.issueLoc !== undefined) {
      tenant.issueLoc = updateTenantDto.issueLoc;
    }
    if (updateTenantDto.tenantJob !== undefined) {
      tenant.tenantJob = updateTenantDto.tenantJob;
    }
    if (updateTenantDto.tenantWorkAt !== undefined) {
      tenant.tenantWorkAt = updateTenantDto.tenantWorkAt;
    }

    const updatedTenant = await this.tenantRepository.save(tenant);
    this.logger.log(`Tenant ${tenantId} updated successfully`);

    return this.formatTenantResponse(updatedTenant, timezone);
  }

  async uploadIdCard(
    roomId: string,
    files: {
      frontImage?: Express.Multer.File;
      backImage?: Express.Multer.File;
    },
    user: JwtPayloadType,
    tenantId?: string,
    timezone: string = 'UTC',
  ) {
    const LOG_PREFIX = '[TENANT_UPLOAD_ID]';

    this.logger.log(
      `${LOG_PREFIX} Start upload ID card | roomId=${roomId}, tenantId=${tenantId ?? 'NEW'}, userId=${user.id}`,
    );

    if (!files.frontImage && !files.backImage) {
      this.logger.warn(`${LOG_PREFIX} No images provided`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Either front or back image of citizenID is required',
      });
    }

    let tenant = new TenantEntity();

    if (tenantId) {
      this.logger.log(`${LOG_PREFIX} Fetching tenant ${tenantId}`);
      const existingTenant = await this.tenantRepository.findById(tenantId, [
        'room',
        'room.house',
        'room.house.owner',
      ]);

      if (!existingTenant) {
        this.logger.warn(
          `${LOG_PREFIX} Tenant not found | tenantId=${tenantId}`,
        );
        throw new BadRequestException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Tenant not found',
        });
      }

      tenant = existingTenant;
    } else {
      tenant.id = randomUUID();
    }

    const room = await this.roomsService.findById(roomId, user.id);
    if (!room) {
      this.logger.warn(`${LOG_PREFIX} Room not found | roomId=${roomId}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { room: 'roomNotFound' },
      });
    }

    if (tenantId && tenant.room?.id !== room.id) {
      this.logger.warn(
        `${LOG_PREFIX} Tenant does not belong to room | tenantRoomId=${tenant.room?.id}, roomId=${room.id}`,
      );
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: `This tenant does not exist in room ${room.name}`,
      });
    }

    tenant.room = room;
    const tenantStatus = new StatusEntity();
    tenantStatus.id = StatusEnum.active;

    tenant.status = tenantStatus;

    const filePath = `${user.id}/${room.house.id}/${room.id}/${tenant.id}/ID/`;

    return this.dataSource.transaction(async (manager) => {
      /** ---------- FRONT IMAGE ---------- */
      await this.processFrontImageID({
        filePath,
        manager,
        tenant,
        tenantId,
        image: files.frontImage,
      });

      /** ---------- BACK IMAGE ---------- */
      await this.processBackImageID({
        filePath,
        manager,
        tenant,
        hasFrontImage: !!files.frontImage,
        image: files.backImage,
        tenantId,
      });

      this.logger.log(
        `${LOG_PREFIX} Uploading ${JSON.stringify(tenant.toJSON())}`,
      );

      const savedTenant = await this.tenantRepository.save(tenant);

      this.logger.log(
        `${LOG_PREFIX} Upload completed successfully | tenantId=${savedTenant.id}`,
      );

      return this.formatTenantResponse(savedTenant, timezone);
    });
  }

  async findByRoom(
    userId: string,
    payload: GetTenantDto,
    timezone: string = 'UTC',
  ): Promise<PaginatedResponseDto<TenantEntity>> {
    // 1. Find the room
    const room = await this.roomsService.findById(payload.room, userId);
    if (!room) {
      this.logger.error(`Room not found with ID: ${payload.room}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { room: 'roomNotFound' },
      });
    }

    // Convert dates to UTC
    if (payload.dateFrom) {
      const utcDate = convertToUTC(payload.dateFrom, timezone);
      payload.dateFrom = utcDate ? utcDate.toISOString() : payload.dateFrom;
    }
    if (payload.dateTo) {
      const utcDate = convertToUTC(payload.dateTo, timezone);
      payload.dateTo = utcDate ? utcDate.toISOString() : payload.dateTo;
    }

    // 3. Pagination
    const page = payload.page || 1;
    const pageSize = payload.pageSize || 10;
    const skip = (page - 1) * pageSize;
    // 4. Get tenants
    const tenants = await this.tenantRepository.findByRoom(room.id, {
      skip,
      take: pageSize,
      status: payload.status,
      dateFrom: payload.dateFrom,
      dateTo: payload.dateTo,
      search: payload.search,
    });

    const formattedTenants = tenants.map((tenant) =>
      this.formatTenantResponse(tenant, timezone),
    );

    return {
      data: formattedTenants,
      page,
      pageSize,
    };
  }

  private formatTenantResponse(
    tenant: TenantEntity,
    timezone: string,
  ): TenantEntity {
    if (tenant.dob) {
      tenant.dob = convertFromUTC(tenant.dob, timezone, 'DD/MM/YYYY') as any;
    }
    if (tenant.issueDate) {
      tenant.issueDate = convertFromUTC(
        tenant.issueDate,
        timezone,
        'DD/MM/YYYY',
      ) as any;
    }
    return tenant;
  }

  async countByRoom(
    userId: string,
    payload: GetTenantDto,
    timezone: string = 'UTC',
  ): Promise<PaginationInfoResponseDto> {
    // 1. Find the room
    const room = await this.roomsService.findById(payload.room, userId);
    if (!room) {
      this.logger.error(`Room not found with ID: ${payload.room}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { room: 'roomNotFound' },
      });
    }

    // Convert dates to UTC
    if (payload.dateFrom) {
      const utcDate = convertToUTC(payload.dateFrom, timezone);
      payload.dateFrom = utcDate ? utcDate.toISOString() : payload.dateFrom;
    }
    if (payload.dateTo) {
      const utcDate = convertToUTC(payload.dateTo, timezone);
      payload.dateTo = utcDate ? utcDate.toISOString() : payload.dateTo;
    }

    // 2. Get the house and check ownership
    const house = room.house;
    if (!house || house.owner?.id !== userId) {
      this.logger.error(
        `User ${userId} is not the owner of house ${house?.id}`,
      );
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { house: 'notHouseOwner' },
      });
    }
    // 3. Count tenants
    const total = await this.tenantRepository.countByRoom(room.id, {
      status: payload.status,
      dateFrom: payload.dateFrom,
      dateTo: payload.dateTo,
      search: payload.search,
    });
    return { total };
  }

  async findById(id: string, relations?: string[]) {
    this.logger.log(`Finding tenant with ID: ${id}`);

    const tenant = await this.tenantRepository.findById(id, relations);

    if (!tenant) {
      this.logger.warn(`Tenant not found with ID: ${id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.BAD_REQUEST,
        message: `Tenant not found with ID: ${id}`,
      });
    }

    this.logger.log(`Found tenant with ID: ${id}`);
    return tenant;
  }

  async toggleStatus(tenantId: string, userJwtPayload: JwtPayloadType) {
    this.logger.log(`Toggling tenant ${tenantId} status`);

    // Validate user and tenant ownership (include status relation)
    const { tenant } = await TenantHelper.validateUserAndTenantOwnership(
      this.usersService,
      this.tenantRepository,
      userJwtPayload,
      tenantId,
      true, // include status
    );

    // Determine new status by toggling current status
    const currentStatus = tenant.status?.id;
    const newStatus =
      currentStatus === StatusEnum.active
        ? StatusEnum.inactive
        : StatusEnum.active;

    // Update tenant status
    tenant.status = {
      id: newStatus,
    } as StatusEntity;

    const updatedTenant = await this.tenantRepository.save(tenant);
    this.logger.log(
      `Tenant ${tenantId} status toggled from ${currentStatus === StatusEnum.active ? 'active' : 'inactive'} to ${newStatus === StatusEnum.active ? 'active' : 'inactive'}`,
    );

    return this.formatTenantResponse(updatedTenant, 'UTC');
  }

  async delete(tenantId: string, userJwtPayload: JwtPayloadType) {
    this.logger.log(`Soft deleting tenant with ID: ${tenantId}`);

    // Validate user and tenant ownership
    await TenantHelper.validateUserAndTenantOwnership(
      this.usersService,
      this.tenantRepository,
      userJwtPayload,
      tenantId,
    );

    // Soft delete the tenant
    await this.tenantRepository.remove(tenantId);
    this.logger.log(`Tenant ${tenantId} soft deleted successfully`);

    return { success: true, message: 'Tenant deleted successfully' };
  }

  async processFrontImageID({
    filePath,
    image,
    manager,
    tenant,
    tenantId,
  }: {
    image?: Express.Multer.File;
    tenantId?: string;
    filePath: string;
    tenant: TenantEntity;
    manager: EntityManager;
  }) {
    const LOG_PREFIX = '[TENANT_UPLOAD_ID]';
    if (!image) return;

    this.logger.log(`${LOG_PREFIX} Processing front ID image`);

    const frontInfo = await this.visionService.recognizeId(image);
    const frontData = frontInfo?.data?.[0];

    if (!frontData?.name && !tenantId) {
      this.logger.warn(
        `${LOG_PREFIX} OCR failed to extract name from front ID`,
      );
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Failed to extract info from uploaded images.',
      });
    }

    const frontFileName = `${frontData?.name ?? tenant.name}-front`;

    const uploadedFrontFile = await this.filesService.uploadFileWithCustomPath(
      image,
      filePath + frontFileName,
    );

    await manager.save(uploadedFrontFile.file);

    if (!uploadedFrontFile?.file) {
      this.logger.error(`${LOG_PREFIX} Failed to upload front ID image`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Failed to upload file',
      });
    }

    Object.entries(frontData || {}).forEach(([key, value]) => {
      if (value && value !== 'N/A') {
        tenant[key] =
          key === 'dob' ? dayjs(value, 'DD/MM/YYYY').toDate() : value;
      }
    });

    tenant.frontIdCardImage = uploadedFrontFile.file;

    if (tenant.citizenId) {
      const existTenantWithID = await this.tenantRepository.findByCitizenID(
        tenant.citizenId,
      );

      if (existTenantWithID && existTenantWithID.id !== tenant.id) {
        throw new BadRequestException({
          status: HttpStatus.BAD_REQUEST,
          message: 'A tenant with this citizenID is already exist!',
        });
      }
    }
  }

  async processBackImageID({
    filePath,
    manager,
    tenant,
    image,
    tenantId,
    hasFrontImage,
  }: {
    image?: Express.Multer.File;
    tenantId?: string;
    filePath: string;
    hasFrontImage?: boolean;
    tenant: TenantEntity;
    manager: EntityManager;
  }) {
    const LOG_PREFIX = '[TENANT_UPLOAD_ID]';

    if (!image) return;

    this.logger.log(`${LOG_PREFIX} Processing back ID image`);

    if (!tenantId && !hasFrontImage) {
      this.logger.warn(
        `${LOG_PREFIX} Back image provided without front image for new tenant`,
      );
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Front ID image is required when uploading back image',
      });
    }

    const backInfo = await this.visionService.recognizeIdBack(image);
    const backData = backInfo?.data?.[0];

    const backFileName = `${tenant.name}-back`;

    const uploadedBackFile = await this.filesService.uploadFileWithCustomPath(
      image,
      filePath + backFileName,
    );

    await manager.save(uploadedBackFile.file);

    if (!uploadedBackFile?.file) {
      this.logger.error(`${LOG_PREFIX} Failed to upload back ID image`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Failed to upload file',
      });
    }

    tenant.issueDate =
      backData?.issueDate && backData.issueDate !== 'N/A'
        ? dayjs(backData.issueDate, 'DD/MM/YYYY').toDate()
        : undefined;

    tenant.issueLoc =
      backData?.issueLoc !== 'N/A' ? backData?.issueLoc : undefined;

    tenant.backIdCardImage = uploadedBackFile.file;
  }

  async downloadIdCards(
    tenantId: string,
    userJwtPayload: JwtPayloadType,
  ): Promise<{ stream: Readable; filename: string }> {
    const LOG_PREFIX = '[TENANT_DOWNLOAD_ID_CARDS]';
    this.logger.log(
      `${LOG_PREFIX} Downloading ID cards for tenant ${tenantId}`,
    );

    // Validate user and tenant ownership, include file relations
    await TenantHelper.validateUserAndTenantOwnership(
      this.usersService,
      this.tenantRepository,
      userJwtPayload,
      tenantId,
      false,
    );

    // Fetch tenant with file relations
    const tenantWithFiles = await this.tenantRepository.findById(tenantId, [
      'frontIdCardImage',
      'backIdCardImage',
    ]);

    if (!tenantWithFiles) {
      this.logger.error(`${LOG_PREFIX} Tenant not found with ID: ${tenantId}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Tenant not found',
      });
    }

    // Check if at least one ID card image exists
    if (!tenantWithFiles.frontIdCardImage && !tenantWithFiles.backIdCardImage) {
      this.logger.warn(
        `${LOG_PREFIX} No ID card images found for tenant ${tenantId}`,
      );
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No ID card images found for this tenant',
      });
    }

    // Create zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    // Handle archive errors
    archive.on('error', (err) => {
      this.logger.error(`${LOG_PREFIX} Archive error: ${err.message}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: `Failed to create zip file: ${err.message}`,
      });
    });

    // Add front ID card image if exists
    if (tenantWithFiles.frontIdCardImage) {
      this.logger.log(
        `${LOG_PREFIX} Adding front ID card image to zip: ${tenantWithFiles.frontIdCardImage.originalName}`,
      );
      const { buffer } = await this.filesService.getFileBuffer(
        tenantWithFiles.frontIdCardImage.id,
      );
      archive.append(buffer, {
        name: tenantWithFiles.frontIdCardImage.originalName || 'front-id.jpg',
      });
    }

    // Add back ID card image if exists
    if (tenantWithFiles.backIdCardImage) {
      this.logger.log(
        `${LOG_PREFIX} Adding back ID card image to zip: ${tenantWithFiles.backIdCardImage.originalName}`,
      );
      const { buffer } = await this.filesService.getFileBuffer(
        tenantWithFiles.backIdCardImage.id,
      );
      archive.append(buffer, {
        name: tenantWithFiles.backIdCardImage.originalName || 'back-id.jpg',
      });
    }

    // Finalize the archive
    await archive.finalize();

    // Sanitize filename: remove special characters and replace spaces with hyphens
    const sanitizedName = (tenantWithFiles.name || 'tenant')
      .normalize('NFD') // Normalize to decomposed form
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphen
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    const filename = `${sanitizedName}-id-cards-${tenantId}.zip`;

    this.logger.log(`${LOG_PREFIX} Successfully created zip file: ${filename}`);

    return {
      stream: archive as unknown as Readable,
      filename,
    };
  }
}
