import {
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HousesService } from 'src/houses/houses.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { UserService } from 'src/users/users.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { GetTenantDto } from './dto/get-tenant.dto';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { TenantRepository } from './tenant.repository';
import { TenantEntity } from './tenant.entity';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private housesService: HousesService,
    private roomsService: RoomsService,
    private usersService: UserService,
    private tenantRepository: TenantRepository,
  ) {}

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
    const house = await this.housesService.findById(createTenantDto.house);

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
    const room = await this.roomsService.findById(createTenantDto.room);

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
    });

    this.logger.log(`Tenant created successfully with ID: ${tenant.id}`);
    return tenant;
  }

  async findByRoom(
    user_id: string,
    payload: GetTenantDto,
  ): Promise<PaginatedResponseDto<TenantEntity>> {
    // 1. Find the room
    const room = await this.roomsService.findById(payload.room);
    if (!room) {
      this.logger.error(`Room not found with ID: ${payload.room}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { room: 'roomNotFound' },
      });
    }
    // 2. Get the house and check ownership
    const house = room.house;
    if (!house || house.owner?.id !== user_id) {
      this.logger.error(
        `User ${user_id} is not the owner of house ${house?.id}`,
      );
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { house: 'notHouseOwner' },
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
    });
    return {
      data: tenants,
      page,
      pageSize,
    };
  }

  async countByRoom(
    user_id: string,
    payload: GetTenantDto,
  ): Promise<PaginationInfoResponseDto> {
    // 1. Find the room
    const room = await this.roomsService.findById(payload.room);
    if (!room) {
      this.logger.error(`Room not found with ID: ${payload.room}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { room: 'roomNotFound' },
      });
    }
    // 2. Get the house and check ownership
    const house = room.house;
    if (!house || house.owner?.id !== user_id) {
      this.logger.error(
        `User ${user_id} is not the owner of house ${house?.id}`,
      );
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { house: 'notHouseOwner' },
      });
    }
    // 3. Count tenants
    const total = await this.tenantRepository.countByRoom(room.id);
    const pageSize = payload.pageSize || 10;
    const totalPages = Math.ceil(total / pageSize);
    return { total, totalPages };
  }

  async findById(id: string) {
    this.logger.log(`Finding tenant with ID: ${id}`);

    const tenant = await this.tenantRepository.findById(id);

    if (!tenant) {
      this.logger.warn(`Tenant not found with ID: ${id}`);
      return null;
    }

    this.logger.log(`Found tenant with ID: ${id}`);
    return tenant;
  }
}
