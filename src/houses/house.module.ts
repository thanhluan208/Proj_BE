import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousesController } from './houses.controller';
import { HousesService } from './houses.service';
import { HouseEntity } from './house.entity';
import { HouseRepository } from './house.repository';
import { UsersModule } from 'src/users/users.module';

import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([HouseEntity]), FilesModule],
  controllers: [HousesController],
  providers: [HousesService, HouseRepository],
  exports: [HousesService, HouseRepository],
})
export class HousesModule {}
