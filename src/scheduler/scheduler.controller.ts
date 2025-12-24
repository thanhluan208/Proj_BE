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
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { SchedulerEntity } from './scheduler.entity';
import { AuthGuard } from '@nestjs/passport';
import { CreateBillSchedulerDto } from './dto/create-bill-scheduler.dto';

@ApiBearerAuth()
@ApiTags('scheduler')
@UseGuards(AuthGuard('jwt'))
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('bill')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a bill scheduler',
    description:
      'Creates an automated scheduler that generates bills at specified intervals using RRule',
  })
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (IANA format, e.g., Asia/Ho_Chi_Minh)',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bill scheduler created successfully',
    type: SchedulerEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  async createBillScheduler(
    @Body() dto: CreateBillSchedulerDto,
    @Request() request,
    @Headers('x-timezone') timezone?: string,
  ): Promise<SchedulerEntity> {
    return this.schedulerService.createBillScheduler(
      dto,
      request.user,
      timezone || 'UTC',
    );
  }
}
