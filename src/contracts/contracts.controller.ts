import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ContractEntity } from './contract.entity';
import { ContractsService } from './contracts.service';
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
}
