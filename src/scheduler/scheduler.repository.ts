import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchedulerEntity } from './scheduler.entity';

@Injectable()
export class SchedulerRepository {
  constructor(
    @InjectRepository(SchedulerEntity)
    private readonly schedulerRepository: Repository<SchedulerEntity>,
  ) {}

  async create(data: Partial<SchedulerEntity>): Promise<SchedulerEntity> {
    return this.schedulerRepository.save(this.schedulerRepository.create(data));
  }

  async findById(id: string): Promise<SchedulerEntity | null> {
    return this.schedulerRepository.findOne({
      where: { id },
    });
  }

  async findAll(): Promise<SchedulerEntity[]> {
    return this.schedulerRepository.find();
  }

  async findActiveJobs(): Promise<SchedulerEntity[]> {
    return this.schedulerRepository.find({
      where: { isActive: true },
    });
  }

  async update(
    id: string,
    data: Partial<SchedulerEntity>,
  ): Promise<SchedulerEntity | null> {
    await this.schedulerRepository.update(id, data);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.schedulerRepository.softDelete(id);
  }

  async delete(id: string): Promise<void> {
    await this.schedulerRepository.delete(id);
  }

  async findActiveByRoomAndType(
    roomId: string,
    type: string,
  ): Promise<SchedulerEntity[]> {
    return this.schedulerRepository.find({
      where: {
        isActive: true,
        metadata: {
          roomId,
          type,
        },
      },
    });
  }
}
