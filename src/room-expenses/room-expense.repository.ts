import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RoomExpenseEntity } from 'src/room-expenses/room-expense.entity';
import { PaginationOptions } from 'src/utils/types/common.type';

interface FindByRoomOptions {
  skip: number;
  take: number;
  from?: string;
  to?: string;
  search?: string;
  amount?: number;
  comparison?: 'bigger' | 'smaller';
  sortBy?: 'date' | 'amount' | 'name';
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class RoomExpenseRepository {
  constructor(
    @InjectRepository(RoomExpenseEntity)
    private readonly repo: Repository<RoomExpenseEntity>,
  ) {}

  async create(data: Partial<RoomExpenseEntity>[]) {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }

  async update(id: string, payload: Partial<RoomExpenseEntity>) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return null;
    Object.assign(entity, payload);
    return await this.repo.save(entity);
  }

  async findById(id: string, relations?: string[]) {
    return await this.repo.findOne({ where: { id }, relations });
  }

  async findByRoom(
    roomId: string,
    options: FindByRoomOptions,
  ): Promise<RoomExpenseEntity[]> {
    const query = this.repo
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.receipt', 'receipt')
      .where('expense.roomId = :roomId', { roomId });

    // Date range filters
    if (options.from) {
      query.andWhere('expense.date >= :from', { from: options.from });
    }
    if (options.to) {
      query.andWhere('expense.date <= :to', { to: options.to });
    }

    // Search by name
    if (options.search) {
      query.andWhere('expense.name ILIKE :search', {
        search: `%${options.search}%`,
      });
    }

    // Amount comparison filter
    if (options.amount !== undefined && options.comparison) {
      if (options.comparison === 'bigger') {
        query.andWhere('expense.amount >= :amount', { amount: options.amount });
      } else if (options.comparison === 'smaller') {
        query.andWhere('expense.amount <= :amount', { amount: options.amount });
      }
    }

    // Sorting
    const SORT_MAP = {
      date: 'expense.date',
      amount: 'expense.amount',
      name: 'expense.name',
    } as const;

    const primarySort = options.sortBy
      ? SORT_MAP[options.sortBy]
      : 'expense.date';

    const primaryOrder = options.sortOrder ?? 'DESC';

    query.orderBy(primarySort, primaryOrder);

    if (primarySort !== 'expense.date') {
      query.addOrderBy('expense.date', 'DESC');
    }

    return query.skip(options.skip).take(options.take).getMany();
  }

  async countByRoom(
    roomId: string,
    filters?: {
      from?: string;
      to?: string;
      search?: string;
      amount?: number;
      comparison?: 'bigger' | 'smaller';
    },
  ): Promise<number> {
    const query = this.repo
      .createQueryBuilder('expense')
      .where('expense.roomId = :roomId', { roomId });

    if (filters?.from) {
      query.andWhere('expense.date >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('expense.date <= :to', { to: filters.to });
    }
    if (filters?.search) {
      query.andWhere('expense.name ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }
    if (filters?.amount !== undefined && filters?.comparison) {
      if (filters.comparison === 'bigger') {
        query.andWhere('expense.amount >= :amount', { amount: filters.amount });
      } else if (filters.comparison === 'smaller') {
        query.andWhere('expense.amount <= :amount', { amount: filters.amount });
      }
    }

    return query.getCount();
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
  }
}
