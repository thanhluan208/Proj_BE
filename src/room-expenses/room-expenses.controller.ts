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
import { RoomExpensesService } from './room-expenses.service';
import { CreateRoomExpenseDto } from './dto/create-room-expense.dto';
import { RoomExpenseEntity } from 'src/room-expenses/room-expense.entity';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import { RoomEntity } from 'src/rooms/room.entity';
import { CheckOwnershipDynamic } from 'src/auth/decorators/ownership.decorator';

@ApiBearerAuth()
@ApiTags('room-expenses')
@UseGuards(AuthGuard(AUTH_CONSTANTS.jwt), OwnershipGuard)
@Controller('room-expenses')
export class RoomExpensesController {
  constructor(private readonly service: RoomExpensesService) {}

  @ApiCreatedResponse({ type: RoomExpenseEntity })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() request,
    @Body() body: CreateRoomExpenseDto,
  ): Promise<RoomExpenseEntity> {
    return this.service.create(body, request.user);
  }

  @ApiCreatedResponse({ type: RoomExpenseEntity })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, description: 'Room Expense ID' })
  update(
    @Param('id') id: string,
    @Request() request,
    @Body() body: CreateRoomExpenseDto,
  ): Promise<RoomExpenseEntity | null> {
    return this.service.update(id, body, request.user);
  }

  @ApiCreatedResponse({ type: PaginatedResponseDto<RoomExpenseEntity> })
  @Get('room/:roomId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'roomId', required: true, description: 'Room ID' })
  @CheckOwnershipDynamic({
    entity: RoomEntity,
    ownerField: 'house.owner',
    resourceIdParam: 'roomId',
  })
  findByRoom(
    @Param('roomId') roomId: string,
    @Request() request,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<RoomExpenseEntity>> {
    return this.service.findByRoom(roomId, request.user, paginationDto);
  }

  @ApiCreatedResponse({ type: PaginationInfoResponseDto })
  @Get('room/:roomId/paging')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'roomId', required: true, description: 'Room ID' })
  @CheckOwnershipDynamic({
    entity: RoomEntity,
    ownerField: 'house.owner',
    resourceIdParam: 'roomId',
  })
  getPagingByRoom(
    @Param('roomId') roomId: string,
    @Request() request,
  ): Promise<PaginationInfoResponseDto> {
    return this.service.countByRoom(roomId, request.user);
  }
}
