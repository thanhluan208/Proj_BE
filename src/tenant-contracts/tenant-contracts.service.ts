import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { ContractEntity } from 'src/contracts/contract.entity';
import { StatusEntity } from 'src/statuses/status.entity';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { TenantEntity } from 'src/tenant/tenant.entity';
import { CreateTenantContractDto } from './dto/create-tenant-contract.dto';
import { TenantContractEntity } from './tenant-contracts.entity';
import { TenantContractsRepository } from './tenant-contracts.repository';
import { RedisService } from 'src/redis/redis.service';
import { REDIS_PREFIX_KEY } from 'src/utils/constant';

@Injectable()
export class TenantContractsService {
  private readonly CACHE_TENANT_CONTRACT_TTL = 60 * 5; // Cache for 5 minutes
  private readonly CACHE_TENANT_CONTRACT_VERSION_KEY = `${REDIS_PREFIX_KEY.tenantContract}:version`;
  private readonly CACHED_KEY = {
    findByActiveTenant: 'findByActiveTenant',
    findCurrentMainTenantContract: 'findCurrentMainTenantContract',
    findTenantContractByTenant: 'findTenantContractByTenant',
  };

  constructor(
    private readonly tenantContractRepository: TenantContractsRepository,
    private readonly redisService: RedisService,
  ) {}

  async create(
    createTenantContractDto: CreateTenantContractDto,
    userId: string,
  ): Promise<TenantContractEntity> {
    const { contractId, tenantId } = createTenantContractDto;

    const cacheVersion =
      (await this.redisService.get(
        `${this.CACHE_TENANT_CONTRACT_VERSION_KEY}:${userId}`,
      )) ?? '0';

    let existRecord: TenantContractEntity | null = null;

    const cachedData = await this.redisService.get(
      `${this.CACHED_KEY.findByActiveTenant}:${tenantId}:${cacheVersion}`,
    );

    if (cachedData) {
      existRecord = JSON.parse(cachedData);
    } else {
      existRecord =
        await this.tenantContractRepository.findByActiveTenant(tenantId);

      this.redisService.set(
        `${this.CACHED_KEY.findByActiveTenant}:${tenantId}:${cacheVersion}`,
        JSON.stringify(existRecord),
        this.CACHE_TENANT_CONTRACT_TTL,
      );
    }

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

  async updateMainTenant(
    updateTenantContractDto: CreateTenantContractDto,
    userId: string,
  ) {
    const { contractId, tenantId } = updateTenantContractDto;

    let currentMainTenant: TenantContractEntity | null = null;

    const cacheVersion =
      (await this.redisService.get(
        `${this.CACHE_TENANT_CONTRACT_VERSION_KEY}:${userId}`,
      )) ?? '0';

    const cachedKey = `${this.CACHED_KEY.findCurrentMainTenantContract}:${contractId}:${cacheVersion}`;

    const cachedData = await this.redisService.get(cachedKey);

    if (cachedData) {
      currentMainTenant = JSON.parse(cachedData);
    } else {
      currentMainTenant =
        await this.tenantContractRepository.findTenantContractIsMainTenant(
          contractId,
        );
    }

    if (currentMainTenant) {
      this.tenantContractRepository.update(currentMainTenant?.id, {
        isMainTenant: false,
      });
    }

    let updateTenantContract: TenantContractEntity | null = null;

    const cachedUpdatedData = await this.redisService.get(
      `${this.CACHED_KEY.findTenantContractByTenant}:${tenantId}:${cacheVersion}`,
    );

    if (cachedUpdatedData) {
      updateTenantContract = JSON.parse(cachedUpdatedData);
    } else {
      updateTenantContract =
        await this.tenantContractRepository.findByActiveTenant(tenantId);
    }

    if (updateTenantContract) {
      updateTenantContract = await this.tenantContractRepository.update(
        updateTenantContract.id,
        {
          isMainTenant: true,
        },
      );
    }

    await this.redisService.incr(
      `${this.CACHE_TENANT_CONTRACT_VERSION_KEY}:${userId}`,
    );
    return updateTenantContract;
  }

  async removeByContract(contractId: string) {
    const tenantContracts =
      await this.tenantContractRepository.findByContract(contractId);
    if (!tenantContracts) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No tenant contract found',
      });
    }
    const removeQueue: Promise<void>[] = [];
    tenantContracts.forEach((elm) => {
      removeQueue.push(this.delete(elm.id));
    });

    await Promise.all(removeQueue);

    return tenantContracts;
  }

  async delete(id: string) {
    return this.tenantContractRepository.remove(id);
  }
}
