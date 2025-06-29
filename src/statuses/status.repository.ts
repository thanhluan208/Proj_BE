import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { StatusEntity } from './status.entity';

@Injectable()
export class StatusRepository {
  constructor(
    @InjectRepository(StatusEntity)
    private readonly statusRepository: Repository<StatusEntity>,
  ) {}

  async create(data: Partial<StatusEntity>): Promise<StatusEntity> {
    const newEntity = this.statusRepository.create(data);
    return await this.statusRepository.save(newEntity);
  }

  async findById(id: number): Promise<StatusEntity | null> {
    return await this.statusRepository.findOne({
      where: { id },
    });
  }

  async findByIds(ids: number[]): Promise<StatusEntity[]> {
    return await this.statusRepository.find({
      where: { id: In(ids) },
    });
  }

  async findByName(name: string): Promise<StatusEntity | null> {
    return await this.statusRepository.findOne({
      where: { name },
    });
  }

  async findAll(): Promise<StatusEntity[]> {
    return await this.statusRepository.find();
  }

  async update(
    id: number,
    payload: Partial<StatusEntity>,
  ): Promise<StatusEntity | null> {
    const entity = await this.statusRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    Object.assign(entity, payload);
    return await this.statusRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    await this.statusRepository.delete(id);
  }
}
