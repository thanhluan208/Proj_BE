import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ContractEntity } from './contract.entity';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dtos/create-contract.dto';
import { PaginatedResponseDto } from 'src/utils/dto/paginated-response.dto';
import { GetContractDto } from './dtos/get-contract.dto';

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
}
