import { UserMapper } from 'src/users/infrastructure/persistence/relational/mappers/user.mapper';
import { SessionEntity } from '../entities/session.entity';
import { Session } from 'src/session/domain/session';
import { UserEntity } from 'src/users/infrastructure/persistence/relational/entities/user.entity';

export class SessionMapper {
  static toDomain(raw: SessionEntity): Session {
    const domainEntity = new Session();
    domainEntity.id = raw.id;
    if (raw.user) {
      domainEntity.user = UserMapper.toDomain(raw.user);
    }
    domainEntity.hash = raw.hash;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: Session): SessionEntity {
    const user = new UserEntity();
    user.id = domainEntity.user.id;

    const persistenceEntity = new SessionEntity();
    persistenceEntity.id = domainEntity.id;
    persistenceEntity.hash = domainEntity.hash;
    persistenceEntity.user = user;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;

    return persistenceEntity;
  }
}
