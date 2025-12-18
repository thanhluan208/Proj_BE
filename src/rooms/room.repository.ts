import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { RoomEntity } from './room.entity';
import { applyRelations } from 'src/utils/query-builder';

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
      relations: ['house', 'house.owner'],
    });
  }

  async findByIdAndOwner(
    id: string,
    owner_id: string,
    relations: string[] = [],
  ): Promise<RoomEntity | null> {
    const query = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.house', 'house')
      .leftJoinAndSelect('house.owner', 'owner')
      .where('room.id = :id', { id })
      .andWhere('owner.id = :owner_id', { owner_id });

    applyRelations(query, relations, {
      rootAlias: 'room',
      allowedRelations: ['contracts', 'contracts.status', 'status'],
      select: true, // change to false if you only need joins for filtering
    });

    return await query.getOne();
  }

  async findByIds(ids: string[]): Promise<RoomEntity[]> {
    return await this.roomRepository.find({
      where: { id: In(ids) },
    });
  }

  async findByHouse(
    houseId: string,
    options: { skip: number; take: number },
  ): Promise<RoomEntity[]> {
    return this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect(
        'room.contracts',
        'contract',
        'contract.status = :active', // FILTER HERE
        { active: StatusEnum.active },
      )
      .where('room.houseId = :houseId', { houseId })
      .skip(options.skip)
      .take(options.take)
      .getMany();
  }

  async countByHouse(house_id: string): Promise<number> {
    return await this.roomRepository.count({
      where: {
        house: { id: house_id },
        deletedAt: IsNull(),
        status: { id: StatusEnum.active },
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
