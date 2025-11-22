import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'src/redis/redis.module';
import { RoomModule } from 'src/rooms/room.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { BillingEntity } from './billing.entity';
import { BillingController } from './billing.controller';
import { BillingRepository } from './billing.repository';
import { BillingService } from './billing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillingEntity]),
    RoomModule,
    TenantModule,
    RedisModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, BillingRepository],
  exports: [BillingService],
})
export class BillingModule {}
