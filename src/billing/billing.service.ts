import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { RedisService } from 'src/redis/redis.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { TenantService } from 'src/tenant/tenant.service';
import { BillingStatusEnum } from './billing-status.enum';
import { BillingRepository } from './billing.repository';
import { CreateBillingDto } from './dto/create-billing.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly CACHE_BILLING_TTL = 60 * 5; // 5 minutes

  constructor(
    private readonly repository: BillingRepository,
    private readonly tenantService: TenantService,
    private readonly roomsService: RoomsService,
    private readonly redisService: RedisService,
  ) {}

  async create(dto: CreateBillingDto, user: JwtPayloadType) {
    // 1. Fetch Tenant
    const tenant = await this.tenantService.findById(dto.tenantId);
    if (!tenant) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          tenant: 'tenantNotFound',
        },
      });
    }

    // 2. Verify Ownership via Room
    const room = await this.roomsService.findById(tenant.room.id, user.id);
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          room: 'accessDeniedOrRoomNotFound',
        },
      });
    }

    // 3. Calculate Costs
    const electricityUsage =
      dto.electricity_end_index - dto.electricity_start_index;
    const waterUsage = dto.water_end_index - dto.water_start_index;

    if (electricityUsage < 0 || waterUsage < 0) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          index: 'endIndexMustBeGreaterThanStartIndex',
        },
      });
    }

    const totalElectricityCost =
      Number(room.fixed_electricity_fee) > 0
        ? Number(room.fixed_electricity_fee)
        : electricityUsage * Number(room.price_per_electricity_unit);

    const totalWaterCost =
      Number(room.fixed_water_fee) > 0
        ? Number(room.fixed_water_fee)
        : waterUsage * Number(room.price_per_water_unit);

    const totalAmount =
      Number(room.base_rent) +
      totalElectricityCost +
      totalWaterCost +
      Number(room.living_fee) +
      Number(room.parking_fee) +
      Number(room.cleaning_fee);

    // 4. Save Billing
    const result = await this.repository.create({
      ...dto,
      tenant,
      room,
      total_electricity_cost: totalElectricityCost,
      total_water_cost: totalWaterCost,
      total_living_cost: room.living_fee,
      total_parking_cost: room.parking_fee,
      total_cleaning_cost: room.cleaning_fee,
      base_rent: room.base_rent,
      total_amount: totalAmount,
      status: BillingStatusEnum.PENDING_TENANT_PAYMENT,
    });

    await this.redisService.del(`billing:tenant:${tenant.id}`);
    await this.redisService.del(`billing:room:${room.id}`);

    return result;
  }

  async findByTenant(tenantId: string, user: JwtPayloadType) {
    // Verify access (owner of the room the tenant belongs to)
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }
    const room = await this.roomsService.findById(tenant.room.id, user.id);
    if (!room) {
      throw new BadRequestException('Access denied');
    }

    const cacheKey = `billing:tenant:${tenantId}`;
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const data = await this.repository.findByTenant(tenantId);
    await this.redisService.set(
      cacheKey,
      JSON.stringify(data),
      this.CACHE_BILLING_TTL,
    );
    return data;
  }

  async findByRoom(roomId: string, user: JwtPayloadType) {
    const room = await this.roomsService.findById(roomId, user.id);
    if (!room) {
      throw new BadRequestException('Access denied');
    }
    const cacheKey = `billing:room:${roomId}`;
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const data = await this.repository.findByRoom(roomId);
    await this.redisService.set(
      cacheKey,
      JSON.stringify(data),
      this.CACHE_BILLING_TTL,
    );
    return data;
  }

  async markAsPaid(id: string, user: JwtPayloadType) {
    const billing = await this.repository.findById(id);
    if (!billing) {
      throw new BadRequestException('Billing not found');
    }

    // Verify ownership
    const room = await this.roomsService.findById(billing.room.id, user.id);
    if (!room) {
      throw new BadRequestException('Access denied');
    }

    const result = await this.repository.update(id, {
      status: BillingStatusEnum.PAID,
      payment_date: new Date(),
    });

    await this.redisService.del(`billing:tenant:${billing.tenant.id}`);
    await this.redisService.del(`billing:room:${room.id}`);

    return result;
  }
}
