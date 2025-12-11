import { Test, TestingModule } from '@nestjs/testing';
import { TenantContractsController } from './tenant-contracts.controller';

describe('TenantContractsController', () => {
  let controller: TenantContractsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantContractsController],
    }).compile();

    controller = module.get<TenantContractsController>(
      TenantContractsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
