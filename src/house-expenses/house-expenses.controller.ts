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
  Headers as NestHeaders,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiParam,
  ApiTags,
  ApiHeader,
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
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (IANA format, e.g., Asia/Ho_Chi_Minh)',
    required: false,
  })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() request,
    @Body() body: CreateHouseExpenseDto,
    @NestHeaders('x-timezone') timezone?: string,
  ): Promise<HouseExpenseEntity> {
    return this.service.create(body, request.user, timezone);
  }

  @ApiCreatedResponse({ type: HouseExpenseEntity })
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (IANA format, e.g., Asia/Ho_Chi_Minh)',
    required: false,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, description: 'House Expense ID' })
  update(
    @Param('id') id: string,
    @Request() request,
    @Body() body: CreateHouseExpenseDto,
    @NestHeaders('x-timezone') timezone?: string,
  ): Promise<HouseExpenseEntity | null> {
    return this.service.update(id, body, request.user, timezone);
  }

  @ApiCreatedResponse({ type: PaginatedResponseDto<HouseExpenseEntity> })
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (IANA format, e.g., Asia/Ho_Chi_Minh)',
    required: false,
  })
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
    @NestHeaders('x-timezone') timezone?: string,
  ): Promise<PaginatedResponseDto<HouseExpenseEntity>> {
    return this.service.findByHouse(
      houseId,
      request.user,
      paginationDto,
      timezone,
    );
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
