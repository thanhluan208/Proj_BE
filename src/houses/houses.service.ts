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

import { FilesService } from 'src/files/files.service';

@Injectable()
export class HousesService {
  private readonly logger = new Logger(HousesService.name);
  private readonly CACHE_HOUSE_TTL = 60 * 15; // Cache for 15 minutes
  private readonly CACHE_HOUSE_VERSION_KEY = `${REDIS_PREFIX_KEY.house}:version`;

  constructor(
    private readonly redisService: RedisService,
    private userService: UserService,
    private houseRepository: HouseRepository,
    private filesService: FilesService,
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

    // Create folder for house
    await this.filesService.createFolder(house.id);

    const houseCacheVersion = await this.redisService.get(
      `${this.CACHE_HOUSE_VERSION_KEY}:${currentUser.id}`,
    );

    const cachedKey = `${REDIS_PREFIX_KEY.house}:${currentUser.id}:total:v${houseCacheVersion}`;

    await this.redisService.del(cachedKey);

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
    await this.redisService.incr(
      `${this.CACHE_HOUSE_VERSION_KEY}:${house.owner.id}`,
    );
    return updatedHouse;
  }

  async findById(id: string, userId: string) {
    this.logger.log(`Finding house with ID: ${id}`);
    let house: HouseEntity | null = null;
    const houseCacheVersion =
      (await this.redisService.get(
        `${this.CACHE_HOUSE_VERSION_KEY}:${userId}`,
      )) ?? '0';

    const key = `${REDIS_PREFIX_KEY.house}:${id}:${userId}:v${houseCacheVersion}`;

    const cachedHouse = await this.redisService.get(key);

    if (cachedHouse) {
      this.logger.log(`House found in cache for ID: ${id}`);
      house = JSON.parse(cachedHouse) as HouseEntity;
    } else {
      this.logger.log(`House not found in cache for ID: ${id}`);
      house = await this.houseRepository.findByIdAndOwner(id, userId);

      if (house) {
        await this.redisService.set(
          key,
          JSON.stringify(house),
          this.CACHE_HOUSE_TTL,
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

    const houseCacheVersion =
      (await this.redisService.get(
        `${this.CACHE_HOUSE_VERSION_KEY}:${user_id}`,
      )) ?? '0';

    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const cacheKey = `${REDIS_PREFIX_KEY.house}:${user_id}:${page}:${pageSize}:v${houseCacheVersion}`;

    let houses: HouseEntity[] = [];

    const cachedHouses = await this.redisService.get(cacheKey);

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

      // Cache the houses if found. However we don't cache the last page if it's not full since it may change due to new houses being added.
      if (houses.length > 0 && houses.length === pageSize) {
        await this.redisService.set(
          cacheKey,
          JSON.stringify(houses),
          this.CACHE_HOUSE_TTL,
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

    const houseCacheVersion =
      (await this.redisService.get(
        `${this.CACHE_HOUSE_VERSION_KEY}:${user_id}`,
      )) ?? '0';

    const cachedKey = `${REDIS_PREFIX_KEY.house}:${user_id}:total:v${houseCacheVersion}`;

    const cachedTotal = await this.redisService.get(cachedKey);

    if (cachedTotal) {
      this.logger.log(`Total houses found in cache for user ${user_id}`);
      total = JSON.parse(cachedTotal) as number;
    } else {
      this.logger.log(`Total houses not found in cache for user ${user_id}`);
      total = await this.houseRepository.countByUser(user_id);

      if (total) {
        await this.redisService.set(
          cachedKey,
          JSON.stringify(total),
          this.CACHE_HOUSE_TTL,
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
