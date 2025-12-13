import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'src/redis/redis.module';
import { RoomModule } from 'src/rooms/room.module';
import { TenantContractsModule } from 'src/tenant-contracts/tenant-contracts.module';
import { BillingController } from './billing.controller';
import { BillingEntity } from './billing.entity';
import { BillingRepository } from './billing.repository';
import { BillingService } from './billing.service';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillingEntity]),
    TenantContractsModule,
    RoomModule,
    RedisModule,
    FilesModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, BillingRepository],
  exports: [BillingService],
})
export class BillingModule {}
