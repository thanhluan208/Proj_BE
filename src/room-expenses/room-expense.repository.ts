import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RoomExpenseEntity } from 'src/room-expenses/room-expense.entity';
import { PaginationOptions } from 'src/utils/types/common.type';

@Injectable()
export class RoomExpenseRepository {
  constructor(
    @InjectRepository(RoomExpenseEntity)
    private readonly repo: Repository<RoomExpenseEntity>,
  ) {}

  async create(data: Partial<RoomExpenseEntity>) {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }

  async update(id: string, payload: Partial<RoomExpenseEntity>) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return null;
    Object.assign(entity, payload);
    return await this.repo.save(entity);
  }

  async findById(id: string) {
    return await this.repo.findOne({ where: { id } });
  }

  async findByRoom(roomId: string, options?: PaginationOptions) {
    return await this.repo.find({
      where: { room: { id: roomId }, deletedAt: IsNull() },
      skip: options?.skip,
      take: options?.take,
      order: { date: 'DESC' },
    });
  }

  async countByRoom(roomId: string) {
    return await this.repo.count({
      where: { room: { id: roomId }, deletedAt: IsNull() },
    });
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
  }
}
