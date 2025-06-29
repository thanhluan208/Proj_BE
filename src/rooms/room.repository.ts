import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { RoomEntity } from './room.entity';

@Injectable()
export class RoomRepository {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
  ) {}

  async create(data: Partial<RoomEntity>): Promise<RoomEntity> {
    const newEntity = this.roomRepository.create(data);
    return await this.roomRepository.save(newEntity);
  }

  async findById(id: string): Promise<RoomEntity | null> {
    return await this.roomRepository.findOne({
      where: { id },
    });
  }

  async findByIds(ids: string[]): Promise<RoomEntity[]> {
    return await this.roomRepository.find({
      where: { id: In(ids) },
    });
  }

  async findByHouse(
    house_id: string,
    options?: { skip?: number; take?: number },
  ): Promise<RoomEntity[]> {
    return await this.roomRepository.find({
      where: {
        house: { id: house_id },
        deletedAt: IsNull(),
      },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async countByHouse(house_id: string): Promise<number> {
    return await this.roomRepository.count({
      where: {
        house: { id: house_id },
        deletedAt: IsNull(),
      },
    });
  }

  async update(
    id: string,
    payload: Partial<RoomEntity>,
  ): Promise<RoomEntity | null> {
    const entity = await this.roomRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    Object.assign(entity, payload);
    return await this.roomRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.roomRepository.softDelete(id);
  }
}
