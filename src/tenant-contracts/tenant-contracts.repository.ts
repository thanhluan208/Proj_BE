import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PaginationOptions } from 'src/utils/types/common.type';
import { TenantContractEntity } from './tenant-contracts.entity';
import { StatusEnum } from 'src/statuses/statuses.enum';

@Injectable()
export class TenantContractsRepository {
  constructor(
    @InjectRepository(TenantContractEntity)
    private readonly repo: Repository<TenantContractEntity>,
  ) {}

  async create(data: Partial<TenantContractEntity>) {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }

  async update(id: string, payload: Partial<TenantContractEntity>) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return null;
    Object.assign(entity, payload);
    return await this.repo.save(entity);
  }

  async findById(id: string) {
    return await this.repo.findOne({ where: { id } });
  }

  async findByContract(contractId: string) {
    return await this.repo.find({
      where: { contract: { id: contractId }, deletedAt: IsNull() },
    });
  }

  async findByMainContract(contractId: string, relations: string[]) {
    return await this.repo.findOne({
      where: {
        contract: { id: contractId },
        deletedAt: IsNull(),
        isMainTenant: true,
      },
      relations,
    });
  }

  async findByActiveTenant(tenantId: string) {
    return await this.repo.findOne({
      where: {
        tenant: { id: tenantId },
        deletedAt: IsNull(),
        status: { id: StatusEnum.active },
      },
    });
  }

  async findTenantContractIsMainTenant(contractId: string) {
    return await this.repo.findOne({
      where: {
        contract: { id: contractId },
        isMainTenant: true,
        deletedAt: IsNull(),
        status: { id: StatusEnum.active },
      },
    });
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
  }
}
