import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import * as multer from 'multer';
import { RoomExpenseEntity } from 'src/room-expenses/room-expense.entity';

import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';
import { EditRoomExpenseDto } from './dto/create-room-expense.dto';
import { GetRoomExpensesDto } from './dto/get-room-expense.dto';
import { CreateApiBody } from './room-expense.helper';
import { RoomExpensesService } from './room-expenses.service';

@ApiBearerAuth()
@ApiTags('room-expenses')
@UseGuards(AuthGuard('jwt'))
@Controller('room-expenses')
export class RoomExpensesController {
  constructor(private readonly service: RoomExpensesService) {}

  @ApiCreatedResponse({ type: [RoomExpenseEntity] })
  @ApiConsumes('multipart/form-data')
  @ApiBody(CreateApiBody)
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('receipts'))
  create(
    @Request() request,
    @Body('roomId') roomId: string,
    @Body('expenses') expensesRaw: string,
    @UploadedFiles() receipts: Express.Multer.File[],
  ): Promise<RoomExpenseEntity[]> {
    return this.service.create(roomId, expensesRaw, receipts, request.user);
  }

  @ApiCreatedResponse({ type: RoomExpenseEntity })
  @ApiConsumes('multipart/form-data')
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, description: 'Room Expense ID' })
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Request() request,
    @Body() body: EditRoomExpenseDto,
    @UploadedFile() receipt?: Express.Multer.File,
  ): Promise<RoomExpenseEntity | null> {
    return this.service.update(id, body, request.user, receipt);
  }

  @ApiOkResponse({ type: PaginatedResponseDto<RoomExpenseEntity> })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', required: true, description: 'Room Expense ID' })
  delete(
    @Param('id') id: string,
    @Request() request,
  ): Promise<RoomExpenseEntity> {
    return this.service.delete(id, request.user);
  }

  @ApiOkResponse({ type: PaginatedResponseDto<RoomExpenseEntity> })
  @Get('room/:roomId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'roomId', required: true, description: 'Room ID' })
  findByRoom(
    @Param('roomId') roomId: string,
    @Request() request,
    @Query() payload: Omit<GetRoomExpensesDto, 'room'>,
  ): Promise<PaginatedResponseDto<RoomExpenseEntity>> {
    return this.service.findByRoom(request.user, {
      room: roomId,
      ...payload,
    });
  }

  @ApiOkResponse({ type: PaginationInfoResponseDto })
  @Get('room/:roomId/paging')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'roomId', required: true, description: 'Room ID' })
  getPagingByRoom(
    @Param('roomId') roomId: string,
    @Request() request,
    @Query() payload: Omit<GetRoomExpensesDto, 'page' | 'pageSize'>,
  ): Promise<PaginationInfoResponseDto> {
    return this.service.countByRoom(roomId, request.user, payload);
  }
}
