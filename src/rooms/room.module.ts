import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomEntity } from './room.entity';
import { RoomRepository } from './room.repository';
import { HousesModule } from 'src/houses/house.module';
import { UsersModule } from 'src/users/users.module';
import { TenantEntity } from 'src/tenant/tenant.entity';
import { BillingEntity } from 'src/billing/billing.entity';
import { RoomExpenseEntity } from 'src/room-expenses/room-expense.entity';

import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [
    HousesModule,
    UsersModule,
    TypeOrmModule.forFeature([
      RoomEntity,
      TenantEntity,
      BillingEntity,
      RoomExpenseEntity,
    ]),
    FilesModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService, RoomRepository],
  exports: [RoomsService],
})
export class RoomModule {}
