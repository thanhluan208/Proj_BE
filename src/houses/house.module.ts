import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousesController } from './houses.controller';
import { HousesService } from './houses.service';
import { HouseEntity } from './house.entity';
import { HouseRepository } from './house.repository';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([HouseEntity])],
  controllers: [HousesController],
  providers: [HousesService, HouseRepository],
  exports: [HousesService],
})
export class HousesModule {}
