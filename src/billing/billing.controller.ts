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
}
