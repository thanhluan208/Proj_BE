import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TenantContractsService } from './tenant-contracts.service';

@ApiBearerAuth()
@ApiTags('tenant-contracts')
@Controller('tenant-contracts')
@UseGuards(AuthGuard('jwt'))
export class TenantContractsController {
  constructor(
    private readonly tenantContractsService: TenantContractsService,
  ) {}
}
