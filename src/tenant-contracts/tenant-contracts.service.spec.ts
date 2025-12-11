import { Test, TestingModule } from '@nestjs/testing';
import { TenantContractsService } from './tenant-contracts.service';

describe('TenantContractsService', () => {
  let service: TenantContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContractsService],
    }).compile();

    service = module.get<TenantContractsService>(TenantContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
