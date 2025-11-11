import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { HouseRepository } from 'src/houses/house.repository';
import { CreateHouseExpenseDto } from './dto/create-house-expense.dto';
import { HouseExpenseRepository } from './house-expense.repository';
import { HouseExpenseEntity } from './house-expense.entity';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import {
  PaginatedResponseDto,
  PaginationInfoResponseDto,
} from 'src/utils/dto/paginated-response.dto';

@Injectable()
export class HouseExpensesService {
  constructor(
    private readonly houseRepository: HouseRepository,
    private readonly expenseRepository: HouseExpenseRepository,
  ) {}

  async create(dto: CreateHouseExpenseDto, user: JwtPayloadType) {
    const house = await this.houseRepository.findByIdAndOwner(
      dto.houseId,
      user.id,
    );
    if (!house) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { house: 'houseNotFound' },
      });
    }

    const expense: Partial<HouseExpenseEntity> = {
      house,
      name: dto.name,
      amount: dto.amount,
      date: new Date(dto.date),
    };

    return await this.expenseRepository.create(expense);
  }

  async update(
    id: string,
    payload: Partial<CreateHouseExpenseDto>,
    user: JwtPayloadType,
  ) {
    const current = await this.expenseRepository.findById(id);
    if (!current) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { expense: 'houseExpenseNotFound' },
      });
    }

    const houseId = payload.houseId ?? current.house.id;
    const house = await this.houseRepository.findByIdAndOwner(houseId, user.id);
    if (!house) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { house: 'houseNotFound' },
      });
    }

    return await this.expenseRepository.update(id, {
      house,
      name: payload.name ?? current.name,
      amount: payload.amount ?? current.amount,
      date: payload.date ? new Date(payload.date) : current.date,
    });
  }

  async findByHouse(
    houseId: string,
    user: JwtPayloadType,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<HouseExpenseEntity>> {
    const house = await this.houseRepository.findByIdAndOwner(houseId, user.id);
    if (!house) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { house: 'houseNotFound' },
      });
    }

    const { page = 1, pageSize = 10 } = pagination;
    const skip = (page - 1) * pageSize;
    const data = await this.expenseRepository.findByHouse(houseId, {
      skip,
      take: pageSize,
    });
    return { data, page, pageSize };
  }

  async countByHouse(
    houseId: string,
    user: JwtPayloadType,
  ): Promise<PaginationInfoResponseDto> {
    const house = await this.houseRepository.findByIdAndOwner(houseId, user.id);
    if (!house) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { house: 'houseNotFound' },
      });
    }
    const total = await this.expenseRepository.countByHouse(houseId);
    return { total };
  }
}
