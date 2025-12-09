import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { BillingEntity } from './billing.entity';
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';

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

  // @ApiCreatedResponse({
  //   type: [BillingEntity],
  // })
  // @Get('tenant/:tenantId')
  // @HttpCode(HttpStatus.OK)
  // @ApiParam({ name: 'tenantId', required: true, description: 'Tenant ID' })
  // findByTenant(
  //   @Param('tenantId') tenantId: string,
  //   @Request() request,
  // ): Promise<BillingEntity[]> {
  //   return this.service.findByTenant(tenantId, request.user);
  // }

  // @ApiCreatedResponse({
  //   type: [BillingEntity],
  // })
  // @Get('room/:roomId')
  // @HttpCode(HttpStatus.OK)
  // @ApiParam({ name: 'roomId', required: true, description: 'Room ID' })
  // findByRoom(
  //   @Param('roomId') roomId: string,
  //   @Request() request,
  // ): Promise<BillingEntity[]> {
  //   return this.service.findByRoom(roomId, request.user);
  // }

  // @ApiCreatedResponse({
  //   type: BillingEntity,
  // })
  // @Patch(':id/pay')
  // @HttpCode(HttpStatus.OK)
  // @ApiParam({ name: 'id', required: true, description: 'Billing ID' })
  // markAsPaid(
  //   @Param('id') id: string,
  //   @Request() request,
  // ): Promise<BillingEntity> {
  //   return this.service.markAsPaid(id, request.user);
  // }
}
