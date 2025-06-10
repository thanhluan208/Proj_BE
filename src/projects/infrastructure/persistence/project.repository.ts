import { DeepPartial } from 'src/utils/types/deep-partial.type';
import { NullableType } from 'src/utils/types/nullable.type';
import { Project } from '../domain/project';

export abstract class ProjectRepository {
  abstract create(
    data: Omit<Project, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<Project>;

  abstract findById(id: Project['id']): Promise<NullableType<Project>>;
  abstract findByIds(ids: Project['id'][]): Promise<Project[]>;

  abstract update(
    id: Project['id'],
    payload: DeepPartial<Project>,
  ): Promise<Project | null>;

  abstract remove(id: Project['id']): Promise<void>;
}
