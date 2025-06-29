import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { HousesModule } from 'src/houses/house.module';
import { RoomModule } from 'src/rooms/room.module';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from './tenant.entity';
import { TenantRepository } from './tenant.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntity]),
    HousesModule,
    RoomModule,
    UsersModule,
  ],
  controllers: [TenantController],
  providers: [TenantService, TenantRepository],
  exports: [TenantService],
})
export class TenantModule {}
