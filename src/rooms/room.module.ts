import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomEntity } from './room.entity';
import { RoomRepository } from './room.repository';
import { HousesModule } from 'src/houses/house.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [HousesModule, UsersModule, TypeOrmModule.forFeature([RoomEntity])],
  controllers: [RoomsController],
  providers: [RoomsService, RoomRepository],
  exports: [RoomsService],
})
export class RoomModule {}
