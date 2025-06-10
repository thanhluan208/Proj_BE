import { Project } from 'src/projects/domain/project';
import { UserProject } from 'src/user-project/domain/user-project';
import { User } from 'src/users/domain/user';
import { DeepPartial } from 'src/utils/types/deep-partial.type';
import { NullableType } from 'src/utils/types/nullable.type';

export abstract class UserProjectRepository {
  abstract create(
    data: Omit<UserProject, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<UserProject>;

  abstract findById(id: UserProject['id']): Promise<NullableType<UserProject>>;

  abstract findByUser(user_id: User['id']): Promise<Project[]>;

  abstract update(
    id: UserProject['id'],
    payload: DeepPartial<UserProject>,
  ): Promise<UserProject | null>;

  abstract remove(id: UserProject['id']): Promise<void>;
}
