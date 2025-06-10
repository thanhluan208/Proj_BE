import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserProject } from 'src/user-project/domain/user-project';
import { NullableType } from 'src/utils/types/nullable.type';
import { In, Repository } from 'typeorm';
import { UserProjectRepository } from '../../user-project-repository';
import { UserProjectEntity } from '../entities/user-project.entity';
import { UserProjectMapper } from '../mappers/user-project.mapper';
import { Project } from 'src/projects/domain/project';
import { User } from 'src/users/domain/user';
import { PaginationOptions } from '../../user-project-repository';

@Injectable()
export class UsersProjectRelationalRepository implements UserProjectRepository {
  constructor(
    @InjectRepository(UserProjectEntity)
    private readonly userProjectRepository: Repository<UserProjectEntity>,
  ) {}

  async create(data: UserProject): Promise<UserProject> {
    const persistenceModel = UserProjectMapper.toPersistence(data);

    const newEntity = await this.userProjectRepository.save(
      this.userProjectRepository.create(persistenceModel),
    );
    return UserProjectMapper.toDomain(newEntity);
  }

  async findById(id: UserProject['id']): Promise<NullableType<UserProject>> {
    const entity = await this.userProjectRepository.findOne({
      where: { id },
    });

    return entity ? UserProjectMapper.toDomain(entity) : null;
  }

  async findByIds(ids: UserProject['id'][]): Promise<UserProject[]> {
    const entities = await this.userProjectRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((user) => UserProjectMapper.toDomain(user));
  }

  async findByUser(
    user_id: User['id'],
    options?: PaginationOptions,
  ): Promise<Project[]> {
    const entities = await this.userProjectRepository.find({
      where: {
        user: { id: user_id },
      },
      skip: options?.skip,
      take: options?.take,
    });

    return entities.map((entity) => UserProjectMapper.toDomain(entity).project);
  }

  async countByUser(user_id: User['id']): Promise<number> {
    return this.userProjectRepository.count({
      where: {
        user: { id: user_id },
      },
    });
  }

  async update(
    id: UserProject['id'],
    payload: Partial<UserProject>,
  ): Promise<UserProject> {
    const entity = await this.userProjectRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('UserProject not found');
    }

    const updatedEntity = await this.userProjectRepository.save(
      this.userProjectRepository.create(
        UserProjectMapper.toPersistence({
          ...UserProjectMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return UserProjectMapper.toDomain(updatedEntity);
  }

  async remove(id: UserProject['id']): Promise<void> {
    await this.userProjectRepository.softDelete(id);
  }
}
