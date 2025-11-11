import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { RoomRepository } from 'src/rooms/room.repository';
import { CreateRoomExpenseDto } from './dto/create-room-expense.dto';
import { RoomExpenseRepository } from './room-expense.repository';
import { RoomExpenseEntity } from 'src/room-expenses/room-expense.entity';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';

@Injectable()
export class RoomExpensesService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly expenseRepository: RoomExpenseRepository,
  ) {}

  async create(dto: CreateRoomExpenseDto, user: JwtPayloadType) {
    const room = await this.roomRepository.findByIdAndOwner(
      dto.roomId,
      user.id,
    );
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { room: 'roomNotFound' },
      });
    }

    const expense: Partial<RoomExpenseEntity> = {
      room,
      name: dto.name,
      amount: dto.amount,
      date: dto.date,
    };

    return await this.expenseRepository.create(expense);
  }

  async update(
    id: string,
    payload: Partial<CreateRoomExpenseDto>,
    user: JwtPayloadType,
  ) {
    const current = await this.expenseRepository.findById(id);
    if (!current) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { expense: 'roomExpenseNotFound' },
      });
    }

    const roomId = payload.roomId ?? current.room.id;
    const room = await this.roomRepository.findByIdAndOwner(roomId, user.id);
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { room: 'roomNotFound' },
      });
    }

    return await this.expenseRepository.update(id, {
      room,
      name: payload.name ?? current.name,
      amount: payload.amount ?? current.amount,
      date: payload.date ?? current.date,
    });
  }

  async findByRoom(
    roomId: string,
    user: JwtPayloadType,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<RoomExpenseEntity>> {
    const room = await this.roomRepository.findByIdAndOwner(roomId, user.id);
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { room: 'roomNotFound' },
      });
    }

    const { page = 1, pageSize = 10 } = pagination;
    const skip = (page - 1) * pageSize;
    const data = await this.expenseRepository.findByRoom(roomId, {
      skip,
      take: pageSize,
    });
    return { data, page, pageSize };
  }

  async countByRoom(
    roomId: string,
    user: JwtPayloadType,
  ): Promise<PaginationInfoResponseDto> {
    const room = await this.roomRepository.findByIdAndOwner(roomId, user.id);
    if (!room) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { room: 'roomNotFound' },
      });
    }
    const total = await this.expenseRepository.countByRoom(roomId);
    return { total };
  }
}
