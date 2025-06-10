import { StatusEntity } from 'src/statuses/infrastructure/persistence/relational/entities/status.entity';
import { UserProject } from 'src/user-project/domain/user-project';
import { UserProjectEntity } from '../entities/user-project.entity';

export class UserProjectMapper {
  static toDomain(raw: UserProjectEntity): UserProject {
    const domainEntity = new UserProject();
    domainEntity.id = raw.id;
    domainEntity.joinedAt = raw.joinedAt;
    domainEntity.role = raw.role;
    domainEntity.status = raw.status;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: UserProject): UserProjectEntity {
    let status: StatusEntity | undefined = undefined;

    if (domainEntity.status) {
      status = new StatusEntity();
      status.id = domainEntity.status.id;
    }

    const persistenceEntity = new UserProjectEntity();
    persistenceEntity.id = domainEntity.id;
    persistenceEntity.role = domainEntity.role;
    persistenceEntity.status = status;
    persistenceEntity.joinedAt = domainEntity.joinedAt;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;
    return persistenceEntity;
  }
}
