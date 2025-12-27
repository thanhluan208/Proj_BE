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
import { convertToUTC, convertFromUTC } from 'src/utils/date-utils';

@Injectable()
export class HouseExpensesService {
  constructor(
    private readonly houseRepository: HouseRepository,
    private readonly expenseRepository: HouseExpenseRepository,
  ) {}

  async create(
    dto: CreateHouseExpenseDto,
    user: JwtPayloadType,
    timezone: string = 'UTC',
  ) {
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

    const expense = new HouseExpenseEntity();
    expense.house = house;
    expense.name = dto.name;
    expense.amount = dto.amount;
    expense.date = convertToUTC(dto.date, timezone) as Date;

    const savedExpense = await this.expenseRepository.create(expense);
    return this.formatHouseExpenseResponse(savedExpense, timezone);
  }

  async update(
    id: string,
    payload: CreateHouseExpenseDto,
    user: JwtPayloadType,
    timezone: string = 'UTC',
  ) {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { expense: 'houseExpenseNotFound' },
      });
    }

    const houseId = payload.houseId ?? expense.house.id;
    const house = await this.houseRepository.findByIdAndOwner(houseId, user.id);
    if (!house) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { house: 'houseNotFound' },
      });
    }

    expense.house = house;
    expense.name = payload.name;
    expense.amount = payload.amount;
    if (payload.date) {
      expense.date = convertToUTC(payload.date, timezone) as Date;
    }

    const savedExpense = await this.expenseRepository.update(id, expense);
    return savedExpense
      ? this.formatHouseExpenseResponse(savedExpense, timezone)
      : null;
  }

  async findByHouse(
    houseId: string,
    user: JwtPayloadType,
    paginationDto: PaginationDto,
    timezone: string = 'UTC',
  ): Promise<PaginatedResponseDto<HouseExpenseEntity>> {
    const house = await this.houseRepository.findByIdAndOwner(houseId, user.id);
    if (!house) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { house: 'houseNotFound' },
      });
    }

    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const data = await this.expenseRepository.findByHouse(houseId, {
      skip,
      take: pageSize,
    });

    const formattedData = data.map((expense) =>
      this.formatHouseExpenseResponse(expense, timezone),
    );

    return {
      data: formattedData,
      page,
      pageSize,
    };
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

  private formatHouseExpenseResponse(
    expense: HouseExpenseEntity,
    timezone: string,
  ): HouseExpenseEntity {
    if (expense.date) {
      expense.date = convertFromUTC(
        expense.date,
        timezone,
        'YYYY-MM-DD',
      ) as any;
    }
    return expense;
  }
}
