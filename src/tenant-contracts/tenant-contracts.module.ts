import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantContractsController } from './tenant-contracts.controller';
import { TenantContractsService } from './tenant-contracts.service';
import { ContractsModule } from 'src/contracts/contracts.module';
import { TenantContractEntity } from './tenant-contracts.entity';
import { TenantModule } from 'src/tenant/tenant.module';
import { TenantContractsRepository } from './tenant-contracts.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TenantContractEntity])],
  controllers: [TenantContractsController],
  providers: [TenantContractsService, TenantContractsRepository],
  exports: [TenantContractsService],
})
export class TenantContractsModule {}
