import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { SessionEntity } from './session.entity';

@Injectable()
export class SessionRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async create(data: Partial<SessionEntity>): Promise<SessionEntity> {
    const newEntity = this.sessionRepository.create(data);
    return await this.sessionRepository.save(newEntity);
  }

  async findById(id: string): Promise<SessionEntity | null> {
    return await this.sessionRepository.findOne({
      where: { id },
    });
  }

  async update(
    id: string,
    payload: Partial<SessionEntity>,
  ): Promise<SessionEntity | null> {
    const entity = await this.sessionRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    Object.assign(entity, payload);
    return await this.sessionRepository.save(entity);
  }

  async deleteById(id: string): Promise<void> {
    await this.sessionRepository.softDelete(id);
  }

  async deleteByUserId(conditions: { userId: string }): Promise<void> {
    await this.sessionRepository.softDelete({
      user: { id: conditions.userId },
    });
  }

  async deleteByUserIdWithExclude(conditions: {
    userId: string;
    excludeSessionId: string;
  }): Promise<void> {
    await this.sessionRepository.softDelete({
      user: { id: conditions.userId },
      id: Not(conditions.excludeSessionId),
    });
  }
}
