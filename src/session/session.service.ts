import { Injectable } from '@nestjs/common';
import { SessionRepository } from './session.repository';
import { SessionEntity } from './session.entity';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  findById(id: string): Promise<SessionEntity | null> {
    return this.sessionRepository.findById(id);
  }

  create(
    data: Omit<SessionEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<SessionEntity> {
    return this.sessionRepository.create(data);
  }

  update(
    id: string,
    payload: Partial<
      Omit<SessionEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<SessionEntity | null> {
    return this.sessionRepository.update(id, payload);
  }

  deleteById(id: string): Promise<void> {
    return this.sessionRepository.deleteById(id);
  }

  deleteByUserId(conditions: { userId: string }): Promise<void> {
    return this.sessionRepository.deleteByUserId(conditions);
  }

  deleteByUserIdWithExclude(conditions: {
    userId: string;
    excludeSessionId: string;
  }): Promise<void> {
    return this.sessionRepository.deleteByUserIdWithExclude(conditions);
  }
}
