import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { ContractEntity } from 'src/contracts/contract.entity';
import { StatusEntity } from 'src/statuses/status.entity';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { TenantEntity } from 'src/tenant/tenant.entity';
import { CreateTenantContractDto } from './dto/create-tenant-contract.dto';
import { TenantContractEntity } from './tenant-contracts.entity';
import { TenantContractsRepository } from './tenant-contracts.repository';

@Injectable()
export class TenantContractsService {
  constructor(
    private readonly tenantContractRepository: TenantContractsRepository,
  ) {}

  async create(
    createTenantContractDto: CreateTenantContractDto,
  ): Promise<TenantContractEntity> {
    const { contractId, tenantId } = createTenantContractDto;
    const existRecord =
      await this.tenantContractRepository.findByActiveTenant(tenantId);
    if (existRecord) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: `This tenant ${tenantId} is already in another contract`,
      });
    }

    const status = new StatusEntity();
    status.id = StatusEnum.active;

    const contract = new ContractEntity();
    contract.id = contractId;

    const tenant = new TenantEntity();
    tenant.id = tenantId;

    const tenantContract = await this.tenantContractRepository.create({
      contract,
      tenant,
      status,
    });

    return tenantContract;
  }
}
