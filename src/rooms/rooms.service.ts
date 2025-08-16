import {
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HousesService } from 'src/houses/houses.service';
import { UserService } from 'src/users/users.service';
import { RoomRepository } from './room.repository';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { GetRoomsDto } from './dto/get-rooms.dto';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { RoomEntity } from './room.entity';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    private userService: UserService,
    private houseService: HousesService,
    private roomsRepository: RoomRepository,
  ) {}

  async create(createRoomDto: CreateRoomDto, userJwtPayload: JwtPayloadType) {
    const currentUser = await this.userService.findById(userJwtPayload.id);
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

    this.logger.log(`Checking if house exists with ID: ${createRoomDto.house}`);
    const house = await this.houseService.findById(createRoomDto.house);

    if (!house) {
      this.logger.error(`House not found with ID: ${createRoomDto.house}`);
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

    this.logger.log(`Ownership verified. Creating room for house: ${house.id}`);
    const room = await this.roomsRepository.create({
      ...createRoomDto,
      house: house,
      owner: currentUser,
    });

    this.logger.log(`Room created successfully with ID: ${room.id}`);
    return room;
  }

  async findById(id: string) {
    this.logger.log(`Finding room with ID: ${id}`);

    const room = await this.roomsRepository.findById(id);

    if (!room) {
      this.logger.warn(`Room not found with ID: ${id}`);
      return null;
    }

    this.logger.log(`Found room with ID: ${id}`);
    return room;
  }

  async findByHouse(
    user_id: string,
    payload: GetRoomsDto,
  ): Promise<PaginatedResponseDto<RoomEntity>> {
    // Check if house exists
    const house = await this.houseService.findById(payload.house);
    if (!house) {
      this.logger.error(`House not found with ID: ${payload.house}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          house: 'houseNotFound',
        },
      });
    }
    // Check ownership
    if (house.owner?.id !== user_id) {
      this.logger.error(
        `User ${user_id} is not the owner of house ${house.id}`,
      );
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          house: 'notHouseOwner',
        },
      });
    }
    // Pagination
    const { page = 1, pageSize = 10 } = payload;
    const skip = (page - 1) * pageSize;
    // Get rooms
    const rooms = await this.roomsRepository.findByHouse(house.id, {
      skip,
      take: pageSize,
    });
    return {
      data: rooms,
      page,
      pageSize,
    };
  }

  async countByHouse(
    user_id: string,
    payload: GetRoomsDto,
  ): Promise<PaginationInfoResponseDto> {
    // Check if house exists
    const house = await this.houseService.findById(payload.house);
    if (!house) {
      this.logger.error(`House not found with ID: ${payload.house}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          house: 'houseNotFound',
        },
      });
    }
    // Check ownership
    if (house.owner?.id !== user_id) {
      this.logger.error(
        `User ${user_id} is not the owner of house ${house.id}`,
      );
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          house: 'notHouseOwner',
        },
      });
    }
    // Count rooms
    const total = await this.roomsRepository.countByHouse(house.id);
    return { total, totalPages: Math.ceil(total / (payload.pageSize || 10)) };
  }
}
