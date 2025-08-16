import {
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserService } from 'src/users/users.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { HouseRepository } from './house.repository';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { HouseEntity } from './house.entity';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { StatusEntity } from 'src/statuses/status.entity';

@Injectable()
export class HousesService {
  private readonly logger = new Logger(HousesService.name);

  constructor(
    private userService: UserService,
    private houseRepository: HouseRepository,
  ) {}

  async create(createHouseDto: CreateHouseDto, userJwtPayload: JwtPayloadType) {
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

    const status = new StatusEntity();
    status.id = StatusEnum.active;

    const house = await this.houseRepository.create({
      ...createHouseDto,
      owner: currentUser,
      status,
    });

    return house;
  }

  async findById(id: string) {
    this.logger.log(`Finding house with ID: ${id}`);

    const house = await this.houseRepository.findById(id);

    if (!house) {
      this.logger.warn(`House not found with ID: ${id}`);
      return null;
    }

    this.logger.log(`Found house with ID: ${id}`);
    return house;
  }

  async findByUser(
    user_id: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<HouseEntity>> {
    this.logger.log(`Finding houses for user ${user_id}`);

    const currentUser = await this.userService.findById(user_id);
    this.logger.log(`Retrieved user: ${currentUser?.id || 'not found'}`);

    if (!currentUser) {
      this.logger.error(`User not found with ID: ${user_id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const houses = await this.houseRepository.findByUser(user_id, {
      skip,
      take: pageSize,
    });

    this.logger.log(`Found ${houses.length} houses for user ${user_id}`);

    return {
      data: houses,
      page,
      pageSize,
    };
  }

  async countByUser(
    user_id: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationInfoResponseDto> {
    this.logger.log(`Finding houses for user ${user_id}`);

    const currentUser = await this.userService.findById(user_id);
    this.logger.log(`Retrieved user: ${currentUser?.id || 'not found'}`);

    if (!currentUser) {
      this.logger.error(`User not found with ID: ${user_id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    const total = await this.houseRepository.countByUser(user_id);

    this.logger.log(`Found ${total} houses for user ${user_id}`);

    return {
      total,
      totalPages: Math.ceil(total / (paginationDto?.pageSize || 10)),
    };
  }
}
