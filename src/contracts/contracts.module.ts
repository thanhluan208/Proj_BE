import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractsRepository } from './contracts.repository';
import { ContractEntity } from './contract.entity';
import { UsersModule } from 'src/users/users.module';
import { RoomModule } from 'src/rooms/room.module';
import { FilesModule } from 'src/files/files.module';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContractEntity]),
    UsersModule,
    RoomModule,
    FilesModule,
    TenantModule,
  ],
  controllers: [ContractsController],
  providers: [ContractsService, ContractsRepository],
  exports: [ContractsService, ContractsRepository],
})
export class ContractsModule {}
