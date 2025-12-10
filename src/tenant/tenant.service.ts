import {
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

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private housesService: HousesService,
    private roomsService: RoomsService,
    private usersService: UserService,
    private tenantRepository: TenantRepository,
    private visionService: VisionService,
    private filesService: FilesService,
  ) {}

  async uploadIdCard(
    tenantId: string,
    files: {
      frontImage?: Express.Multer.File[];
      backImage?: Express.Multer.File[];
    },
  ) {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          tenant: 'tenantNotFound',
        },
      });
    }

    // Ensure room and house are loaded for path construction
    // If tenant.room or tenant.room.house is missing, we might need to fetch them.
    // Assuming findById loads relations or we fetch them here.
    // Based on repository, findById might not load deep relations.
    // Let's fetch the room and house to be sure.
    const room = await this.roomsService.findById(
      tenant.room.id,
      tenant.room.house.owner.id,
    ); // This might be tricky if we don't have owner ID easily.
    // Actually, let's just use the IDs we have if they are available in the tenant object.
    // If tenant.room is just an ID, we need to fetch.
    // Let's assume for now we can construct the path from what we have or fetch if needed.
    // To be safe and correct, let's fetch the full tenant with relations if needed, or just rely on the IDs if they are present.
    // The tenant entity definition shows ManyToOne, so they should be there if eager or joined.
    // TenantRepository.findById uses findOne, which usually doesn't load relations unless specified.
    // Let's check TenantRepository.findById again.
    // It just does findOne({ where: { id } }).
    // We should probably update findById to load relations or use a query builder here.
    // For now, let's assume we need to fetch the room and house.

    // Wait, I can just use the IDs if I trust the structure.
    // But to be safe, I'll use the IDs from the tenant object if they exist.
    // If not, I might need to fetch.
    // Let's assume tenant.room and tenant.room.house are loaded.
    // If not, I'll need to fix TenantRepository.findById or do a separate fetch.

    // Actually, looking at TenantRepository.findById:
    // return await this.tenantRepository.findOne({ where: { id } });
    // This will NOT load relations by default unless eager: true is set in Entity.
    // Let's check TenantEntity.

    // TenantEntity:
    // @ManyToOne(() => RoomEntity, { eager: true })
    // room: RoomEntity;

    // RoomEntity:
    // @ManyToOne(() => HouseEntity, { eager: true })
    // house: HouseEntity;

    // So relations ARE loaded eagerly! Great.

    const houseId = tenant.room.house.id;
    const roomId = tenant.room.id;

    const frontImage = files.frontImage?.[0];
    const backImage = files.backImage?.[0];

    if (frontImage) {
      // 1. Extract info from front image
      const frontInfo = await this.visionService.recognizeId(frontImage);
      const data = frontInfo.data[0];

      // 2. Update tenant info
      tenant.citizenId = data.id !== 'N/A' ? data.id : tenant.citizenId;
      tenant.name = data.name !== 'N/A' ? data.name : tenant.name;
      tenant.dob =
        data.dob !== 'N/A'
          ? new Date(data.dob.split('/').reverse().join('-'))
          : tenant.dob;
      tenant.sex = data.sex !== 'N/A' ? data.sex : tenant.sex;
      tenant.nationality =
        data.nationality !== 'N/A' ? data.nationality : tenant.nationality;
      tenant.home = data.home !== 'N/A' ? data.home : tenant.home;
      tenant.address = data.address !== 'N/A' ? data.address : tenant.address;

      // 3. Upload image
      const path = `${houseId}/${roomId}/${tenant.id}/${tenant.id}_front-ID`;
      const uploadedFile = await this.filesService.uploadFileWithCustomPath(
        frontImage,
        path,
      );
      tenant.frontIdCardImagePath = uploadedFile.path;
    }

    if (backImage) {
      // 1. Extract info from back image
      const backInfo = await this.visionService.recognizeIdBack(backImage);
      const data = backInfo.data[0];

      // 2. Update tenant info
      tenant.issueDate =
        data.issueDate !== 'N/A'
          ? new Date(data.issueDate.split('/').reverse().join('-'))
          : tenant.issueDate;
      tenant.issueLoc =
        data.issueLoc !== 'N/A' ? data.issueLoc : tenant.issueLoc;

      // 3. Upload image
      const path = `${houseId}/${roomId}/${tenant.id}/${tenant.id}_back-ID`;
      const uploadedFile = await this.filesService.uploadFileWithCustomPath(
        backImage,
        path,
      );
      tenant.backIdCardImagePath = uploadedFile.path;
    }

    return this.tenantRepository.save(tenant);
  }

  async create(
    createTenantDto: CreateTenantDto,
    userJwtPayload: JwtPayloadType,
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
      dob: createTenantDto.dob ? new Date(createTenantDto.dob) : undefined,
      address: createTenantDto.address,
      phoneNumber: createTenantDto.phoneNumber,
      citizenId: createTenantDto.citizenId,
      sex: createTenantDto.sex,
      nationality: createTenantDto.nationality,
      home: createTenantDto.home,
      issueDate: createTenantDto.issueDate
        ? new Date(createTenantDto.issueDate)
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
    return tenant;
  }

  async findByRoom(
    userId: string,
    payload: GetTenantDto,
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
    return {
      data: tenants,
      page,
      pageSize,
    };
  }

  async countByRoom(
    userId: string,
    payload: GetTenantDto,
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

  async update(
    tenantId: string,
    updateTenantDto: UpdateTenantDto,
    userJwtPayload: JwtPayloadType,
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
        ? new Date(updateTenantDto.dob)
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
        ? new Date(updateTenantDto.issueDate)
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

    return updatedTenant;
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

    return updatedTenant;
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
}
