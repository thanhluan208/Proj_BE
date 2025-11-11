import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_CONSTANTS } from 'src/utils/constant';
import { OwnershipGuard } from 'src/auth/guards/ownership.guard';
import { CheckOwnershipDynamic } from 'src/auth/decorators/ownership.decorator';
import { HouseEntity } from 'src/houses/house.entity';
import { HouseExpensesService } from './house-expenses.service';
import { CreateHouseExpenseDto } from './dto/create-house-expense.dto';
import { HouseExpenseEntity } from './house-expense.entity';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { PaginationDto } from 'src/utils/dto/pagination.dto';

@ApiBearerAuth()
@ApiTags('house-expenses')
@UseGuards(AuthGuard(AUTH_CONSTANTS.jwt), OwnershipGuard)
@Controller('house-expenses')
export class HouseExpensesController {
  constructor(private readonly service: HouseExpensesService) {}

  @ApiCreatedResponse({ type: HouseExpenseEntity })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() request,
    @Body() body: CreateHouseExpenseDto,
  ): Promise<HouseExpenseEntity> {
    return this.service.create(body, request.user);
  }

  @ApiCreatedResponse({ type: HouseExpenseEntity })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, description: 'House Expense ID' })
  update(
    @Param('id') id: string,
    @Request() request,
    @Body() body: CreateHouseExpenseDto,
  ): Promise<HouseExpenseEntity | null> {
    return this.service.update(id, body, request.user);
  }

  @ApiCreatedResponse({ type: PaginatedResponseDto<HouseExpenseEntity> })
  @Get('house/:houseId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'houseId', required: true, description: 'House ID' })
  @CheckOwnershipDynamic({
    entity: HouseEntity,
    ownerField: 'owner',
    resourceIdParam: 'houseId',
  })
  findByHouse(
    @Param('houseId') houseId: string,
    @Request() request,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<HouseExpenseEntity>> {
    return this.service.findByHouse(houseId, request.user, paginationDto);
  }

  @ApiCreatedResponse({ type: PaginationInfoResponseDto })
  @Get('house/:houseId/paging')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'houseId', required: true, description: 'House ID' })
  @CheckOwnershipDynamic({
    entity: HouseEntity,
    ownerField: 'owner',
    resourceIdParam: 'houseId',
  })
  getPagingByHouse(
    @Param('houseId') houseId: string,
    @Request() request,
  ): Promise<PaginationInfoResponseDto> {
    return this.service.countByHouse(houseId, request.user);
  }
}
