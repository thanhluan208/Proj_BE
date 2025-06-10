import { User } from 'src/users/domain/user';
import { UserEntity } from '../entities/user.entity';
import { RoleEntity } from 'src/roles/infrastructure/persistence/relational/entities/role.entity';
import { StatusEntity } from 'src/statuses/infrastructure/persistence/relational/entities/status.entity';

export class UserMapper {
  static toDomain(raw: UserEntity): User {
    const domainEntity = new User();
    domainEntity.id = raw.id;
    domainEntity.email = raw.email;
    domainEntity.password = raw.password;
    domainEntity.provider = raw.provider;
    domainEntity.firstName = raw.firstName;
    domainEntity.lastName = raw.lastName;
    domainEntity.role = raw.role;
    domainEntity.status = raw.status;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: User): UserEntity {
    let role: RoleEntity | undefined = undefined;

    if (domainEntity.role) {
      role = new RoleEntity();
      role.id = domainEntity.role.id;
    }

    let status: StatusEntity | undefined = undefined;

    if (domainEntity.status) {
      status = new StatusEntity();
      status.id = domainEntity.status.id;
    }

    const persistenceEntity = new UserEntity();
    persistenceEntity.id = domainEntity.id;
    persistenceEntity.email = domainEntity.email;
    persistenceEntity.password = domainEntity.password;
    persistenceEntity.provider = domainEntity.provider;
    persistenceEntity.firstName = domainEntity.firstName;
    persistenceEntity.lastName = domainEntity.lastName;
    persistenceEntity.role = role;
    persistenceEntity.status = status;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;
    return persistenceEntity;
  }
}
