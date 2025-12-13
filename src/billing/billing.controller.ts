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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_CONSTANTS } from 'src/utils/constant';
import { BillingEntity } from './billing.entity';
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { PaginatedResponseDto } from 'src/utils/dto/paginated-response.dto';
import { GetBillingDto } from './dto/get-billing.dto';

@ApiBearerAuth()
@ApiTags('billing')
@UseGuards(AuthGuard(AUTH_CONSTANTS.jwt))
@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @ApiCreatedResponse({
    type: BillingEntity,
  })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() request,
    @Body() body: CreateBillingDto,
  ): Promise<BillingEntity> {
    return this.service.create(body, request.user);
  }

  @ApiOkResponse({
    type: PaginatedResponseDto<BillingEntity>,
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  findByHouse(
    @Request() request,
    @Query() query: GetBillingDto,
  ): Promise<PaginatedResponseDto<BillingEntity>> {
    return this.service.getBillsByRoom(query, request.user);
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
    @Query() query: GetBillingDto,
  ): Promise<{ total: number }> {
    return this.service.getTotalBillByRoom(query, request.user);
  }
}
