import { UserProject } from 'src/user-project/domain/user-project';
import { DeepPartial } from 'src/utils/types/deep-partial.type';
import { NullableType } from 'src/utils/types/nullable.type';

export abstract class UserProjectRepository {
  abstract create(
    data: Omit<UserProject, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<UserProject>;

  abstract findById(id: UserProject['id']): Promise<NullableType<UserProject>>;

  abstract update(
    id: UserProject['id'],
    payload: DeepPartial<UserProject>,
  ): Promise<UserProject | null>;

  abstract remove(id: UserProject['id']): Promise<void>;
}
