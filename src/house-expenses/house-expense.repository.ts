import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { HouseExpenseEntity } from './house-expense.entity';
import { PaginationOptions } from 'src/utils/types/common.type';

@Injectable()
export class HouseExpenseRepository {
  constructor(
    @InjectRepository(HouseExpenseEntity)
    private readonly repo: Repository<HouseExpenseEntity>,
  ) {}

  async create(data: Partial<HouseExpenseEntity>) {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }

  async update(id: string, payload: Partial<HouseExpenseEntity>) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return null;
    Object.assign(entity, payload);
    return await this.repo.save(entity);
  }

  async findById(id: string) {
    return await this.repo.findOne({ where: { id } });
  }

  async findByHouse(houseId: string, options?: PaginationOptions) {
    return await this.repo.find({
      where: { house: { id: houseId }, deletedAt: IsNull() },
      skip: options?.skip,
      take: options?.take,
      order: { date: 'DESC' },
    });
  }

  async countByHouse(houseId: string) {
    return await this.repo.count({
      where: { house: { id: houseId }, deletedAt: IsNull() },
    });
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
  }
}
