import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ContractEntity } from './contract.entity';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dtos/create-contract.dto';
import { PaginatedResponseDto } from 'src/utils/dto/paginated-response.dto';
import { GetContractDto } from './dtos/get-contract.dto';
import { CreateTenantContractDto } from 'src/tenant-contracts/dto/create-tenant-contract.dto';

@ApiBearerAuth()
@ApiTags('contracts')
@Controller('contracts')
@UseGuards(AuthGuard('jwt'))
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @ApiCreatedResponse({
    type: ContractEntity,
  })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() request, @Body() contractData: CreateContractDto) {
    return await this.contractsService.create(contractData, request.user);
  }

  @ApiCreatedResponse({
    type: ContractEntity,
  })
  @Post('update-main-tenant')
  @HttpCode(HttpStatus.CREATED)
  async updateMainTenant(
    @Request() request,
    @Body() contractData: CreateTenantContractDto,
  ) {
    return await this.contractsService.updateMainTenantContract(
      contractData,
      request.user,
    );
  }

  @ApiOkResponse({
    type: ContractEntity,
  })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, description: 'Contract ID' })
  async delete(@Request() request, @Param('id') id: string) {
    return await this.contractsService.delete(id, request.user);
  }

  @ApiOkResponse({
    type: PaginatedResponseDto<ContractEntity>,
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  findByHouse(
    @Request() request,
    @Query() query: GetContractDto,
  ): Promise<PaginatedResponseDto<ContractEntity>> {
    return this.contractsService.findContractsByRoom(
      query.room,
      request.user.id,
      query,
    );
  }

  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
      },
    },
  })
  @Get('paging')
  @HttpCode(HttpStatus.OK)
  getTotalByHouse(
    @Request() request,
    @Query() query: GetContractDto,
  ): Promise<{ total: number }> {
    return this.contractsService.getTotalContractByRoom(
      query.room,
      request.user.id,
      query,
    );
  }
}
