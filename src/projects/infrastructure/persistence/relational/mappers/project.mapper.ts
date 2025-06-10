import { Project } from 'src/projects/domain/project';
import { ProjectEntity } from '../entities/project.entity';
import { StatusEntity } from 'src/statuses/infrastructure/persistence/relational/entities/status.entity';

export class ProjectMapper {
  static toDomain(raw: ProjectEntity): Project {
    const domainEntity = new Project();

    domainEntity.createdAt = raw.createdAt;
    domainEntity.deletedAt = raw.deletedAt;
    domainEntity.description = raw.description;
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.startAt = raw.startAt;
    domainEntity.endAt = raw.endAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.progress = raw.progress;
    domainEntity.status = raw.status;

    return domainEntity;
  }

  static toPersistence(domainEntity: Project): ProjectEntity {
    let status: StatusEntity | undefined = undefined;

    if (domainEntity.status) {
      status = new StatusEntity();
      status.id = domainEntity.status.id;
    }

    const persistenceEntity = new ProjectEntity();
    persistenceEntity.id = domainEntity.id;
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.description = domainEntity.description;
    persistenceEntity.progress = domainEntity.progress;
    persistenceEntity.startAt = domainEntity.startAt;
    persistenceEntity.endAt = domainEntity.endAt;
    persistenceEntity.status = status;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;
    return persistenceEntity;
  }
}
