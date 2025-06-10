import { StatusEntity } from 'src/statuses/infrastructure/persistence/relational/entities/status.entity';
import { UserProject } from 'src/user-project/domain/user-project';
import { UserProjectEntity } from '../entities/user-project.entity';
import { UserEntity } from 'src/users/infrastructure/persistence/relational/entities/user.entity';
import { ProjectEntity } from 'src/projects/infrastructure/persistence/relational/entities/project.entity';

export class UserProjectMapper {
  static toDomain(raw: UserProjectEntity): UserProject {
    const domainEntity = new UserProject();
    domainEntity.id = raw.id;
    domainEntity.joinedAt = raw.joinedAt;
    domainEntity.role = raw.role;
    domainEntity.status = raw.status;
    domainEntity.user = raw.user;
    domainEntity.project = raw.project;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: UserProject): UserProjectEntity {
    const status = new StatusEntity();
    status.id = domainEntity.status.id;

    const user = new UserEntity();
    user.id = domainEntity.user.id;

    const project = new ProjectEntity();
    project.id = domainEntity.project.id;

    const persistenceEntity = new UserProjectEntity();
    persistenceEntity.id = domainEntity.id;
    persistenceEntity.role = domainEntity.role;
    persistenceEntity.status = status;
    persistenceEntity.user = user;
    persistenceEntity.project = project;
    persistenceEntity.joinedAt = domainEntity.joinedAt;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;
    return persistenceEntity;
  }
}
