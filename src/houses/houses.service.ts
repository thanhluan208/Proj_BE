import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { RedisService } from 'src/redis/redis.service';
import { StatusEntity } from 'src/statuses/status.entity';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { UserService } from 'src/users/users.service';
import { REDIS_PREFIX_KEY } from 'src/utils/constant';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import { CreateHouseDto } from './dto/create-house.dto';
import { HouseEntity } from './house.entity';
import { HouseRepository } from './house.repository';

@Injectable()
export class HousesService {
  private readonly logger = new Logger(HousesService.name);
  private readonly cacheHouseInfoTTL = 3600; // Cache for 1 hour
  private readonly cacheHousesTotalTTL = 86400; // Cache for 24 hours

  constructor(
    private readonly redisService: RedisService,
    private userService: UserService,
    private houseRepository: HouseRepository,
  ) {}

  async create(createHouseDto: CreateHouseDto, userJwtPayload: JwtPayloadType) {
    const currentUser = await this.userService.findById(userJwtPayload.id);

    const status = new StatusEntity();
    status.id = StatusEnum.active;

    const house = await this.houseRepository.create({
      ...createHouseDto,
      owner: currentUser,
      status,
    });

    return house;
  }

  async update(id: string, updateHouseDto: Partial<CreateHouseDto>) {
    const house = await this.houseRepository.findById(id);
    if (!house) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          house: 'houseNotFound',
        },
      });
    }

    const updatedHouse = await this.houseRepository.update(id, {
      ...updateHouseDto,
    });
    // Invalidate cache
    await this.redisService.delByPattern(`${REDIS_PREFIX_KEY.house}*`);
    return updatedHouse;
  }

  async findById(id: string) {
    this.logger.log(`Finding house with ID: ${id}`);
    let house: HouseEntity | null = null;

    const cachedHouse = await this.redisService.get(
      `${REDIS_PREFIX_KEY.house}${id}`,
    );

    if (cachedHouse) {
      this.logger.log(`House found in cache for ID: ${id}`);
      house = JSON.parse(cachedHouse) as HouseEntity;
    } else {
      this.logger.log(`House not found in cache for ID: ${id}`);
      house = await this.houseRepository.findById(id);

      if (house) {
        await this.redisService.set(
          `${REDIS_PREFIX_KEY.house}${id}`,
          JSON.stringify(house),
          this.cacheHouseInfoTTL,
        );
        this.logger.log(`House cached for ID: ${id}`);
      } else {
        this.logger.warn(`House not found with ID: ${id}`);
      }
    }

    if (!house) {
      this.logger.warn(`House not found with ID: ${id}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          house: 'houseNotFound',
        },
      });
    }

    this.logger.log(`Found house with ID: ${id}`);
    return house;
  }

  async findByUser(
    user_id: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<HouseEntity>> {
    this.logger.log(`Finding houses for user ${user_id}`);

    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    let houses: HouseEntity[] = [];

    const cachedHouses = await this.redisService.get(
      `${REDIS_PREFIX_KEY.house}${user_id}:${page}:${pageSize}`,
    );

    if (cachedHouses) {
      this.logger.log(
        `Houses found in cache for user ${user_id}, page ${page}, pageSize ${pageSize}`,
      );
      houses = JSON.parse(cachedHouses) as HouseEntity[];
    } else {
      this.logger.log(
        `Houses not found in cache for user ${user_id}, page ${page}, pageSize ${pageSize}`,
      );

      houses = await this.houseRepository.findByUser(user_id, {
        skip,
        take: pageSize,
      });

      if (houses.length > 0) {
        await this.redisService.set(
          `${REDIS_PREFIX_KEY.house}${user_id}:${page}:${pageSize}`,
          JSON.stringify(houses),
          this.cacheHouseInfoTTL,
        );
        this.logger.log(
          `Houses cached for user ${user_id}, page ${page}, pageSize ${pageSize}`,
        );
      } else {
        this.logger.warn(
          `No houses found for user ${user_id} to cache, page ${page}, pageSize ${pageSize}`,
        );
      }
    }

    houses = await this.houseRepository.findByUser(user_id, {
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

  async countByUser(user_id: string): Promise<PaginationInfoResponseDto> {
    let total = 0;

    const cachedTotal = await this.redisService.get(
      `${REDIS_PREFIX_KEY.house}${user_id}:total`,
    );

    if (cachedTotal) {
      this.logger.log(`Total houses found in cache for user ${user_id}`);
      total = JSON.parse(cachedTotal) as number;
    } else {
      this.logger.log(`Total houses not found in cache for user ${user_id}`);
      total = await this.houseRepository.countByUser(user_id);

      if (total) {
        await this.redisService.set(
          `${REDIS_PREFIX_KEY.house}${user_id}:total`,
          JSON.stringify(total),
          this.cacheHousesTotalTTL,
        );
        this.logger.log(`Total houses cached for user ${user_id}`);
      } else {
        this.logger.warn(`No houses found for user ${user_id} to cache`);
      }
    }

    this.logger.log(`Found ${total} houses for user ${user_id}`);

    return {
      total,
    };
  }
}
