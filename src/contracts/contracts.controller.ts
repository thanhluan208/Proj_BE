import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { ContractEntity } from './contract.entity';
import { AuthGuard } from '@nestjs/passport';
import { CreateContractDto } from './dtos/create-contract.dto';

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

  @Get()
  @ApiOperation({ summary: 'Get all contracts' })
  @ApiResponse({
    status: 200,
    description: 'List of all contracts',
    type: [ContractEntity],
  })
  async findAll(): Promise<ContractEntity[]> {
    return await this.contractsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiResponse({
    status: 200,
    description: 'Contract found',
    type: ContractEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Contract not found',
  })
  async findById(@Param('id') id: string): Promise<ContractEntity> {
    return await this.contractsService.findById(id);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get contracts by tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Contracts found for tenant',
    type: [ContractEntity],
  })
  async findByTenant(
    @Param('tenantId') tenantId: string,
  ): Promise<ContractEntity[]> {
    return await this.contractsService.findByTenant(tenantId);
  }

  @Get('owner/:ownerId')
  @ApiOperation({ summary: 'Get contracts by owner ID' })
  @ApiResponse({
    status: 200,
    description: 'Contracts found for owner',
    type: [ContractEntity],
  })
  async findByOwner(
    @Param('ownerId') ownerId: string,
  ): Promise<ContractEntity[]> {
    return await this.contractsService.findByOwner(ownerId);
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Get contracts by room ID' })
  @ApiResponse({
    status: 200,
    description: 'Contracts found for room',
    type: [ContractEntity],
  })
  async findByRoom(@Param('roomId') roomId: string): Promise<ContractEntity[]> {
    return await this.contractsService.findByRoom(roomId);
  }

  @Get('file/:fileId')
  @ApiOperation({ summary: 'Get contract by file ID' })
  @ApiResponse({
    status: 200,
    description: 'Contract found for file',
    type: ContractEntity,
  })
  async findByFile(
    @Param('fileId') fileId: string,
  ): Promise<ContractEntity | null> {
    return await this.contractsService.findByFile(fileId);
  }

  @Get('status/:statusId')
  @ApiOperation({ summary: 'Get contracts by status ID' })
  @ApiResponse({
    status: 200,
    description: 'Contracts found for status',
    type: [ContractEntity],
  })
  async findByStatus(
    @Param('statusId') statusId: string,
  ): Promise<ContractEntity[]> {
    return await this.contractsService.findByStatus(statusId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contract by ID' })
  @ApiResponse({
    status: 200,
    description: 'Contract updated successfully',
    type: ContractEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Contract not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<ContractEntity>,
  ): Promise<ContractEntity> {
    return await this.contractsService.update(id, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete contract by ID' })
  @ApiResponse({
    status: 204,
    description: 'Contract soft deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Contract not found',
  })
  async softDelete(@Param('id') id: string): Promise<void> {
    await this.contractsService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft deleted contract by ID' })
  @ApiResponse({
    status: 200,
    description: 'Contract restored successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Contract not found',
  })
  async restore(@Param('id') id: string): Promise<{ restored: boolean }> {
    const restored = await this.contractsService.restore(id);
    return { restored };
  }

  @Get('count/total')
  @ApiOperation({ summary: 'Get total count of contracts' })
  @ApiResponse({
    status: 200,
    description: 'Total count of contracts',
    schema: { type: 'number' },
  })
  async count(): Promise<{ count: number }> {
    const count = await this.contractsService.count();
    return { count };
  }
}
