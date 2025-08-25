import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { HouseEntity } from './house.entity';
import { PaginationOptions } from 'src/utils/types/common.type';

@Injectable()
export class HouseRepository {
  constructor(
    @InjectRepository(HouseEntity)
    private readonly houseRepository: Repository<HouseEntity>,
  ) {}

  async create(data: Partial<HouseEntity>): Promise<HouseEntity> {
    const newEntity = this.houseRepository.create(data);
    return await this.houseRepository.save(newEntity);
  }

  async findById(id: string): Promise<HouseEntity | null> {
    return await this.houseRepository.findOne({
      where: { id },
    });
  }

  async findByIds(ids: string[]): Promise<HouseEntity[]> {
    return await this.houseRepository.find({
      where: { id: In(ids) },
    });
  }

  async findByUser(
    user_id: string,
    options?: PaginationOptions,
  ): Promise<HouseEntity[]> {
    return await this.houseRepository.find({
      where: {
        owner: { id: user_id },
        deletedAt: IsNull(),
      },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async countByUser(user_id: string): Promise<number> {
    return await this.houseRepository.count({
      where: {
        owner: { id: user_id },
        deletedAt: IsNull(),
      },
    });
  }

  async update(
    id: string,
    payload: Partial<HouseEntity>,
  ): Promise<HouseEntity | null> {
    const entity = await this.houseRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    Object.assign(entity, payload);
    return await this.houseRepository.save(entity);
  }

  async findByIdAndOwner(id: string, owner_id: string) {
    return await this.houseRepository.findOne({
      where: {
        id,
        owner: { id: owner_id },
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.houseRepository.softDelete(id);
  }
}
