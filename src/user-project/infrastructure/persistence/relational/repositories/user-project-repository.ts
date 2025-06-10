import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserProject } from 'src/user-project/domain/user-project';
import { NullableType } from 'src/utils/types/nullable.type';
import { In, Repository } from 'typeorm';
import { UserProjectRepository } from '../../user-project-repository';
import { UserProjectEntity } from '../entities/user-project.entity';
import { UserProjectMapper } from '../mappers/user-project.mapper';

@Injectable()
export class UsersProjectRelationalRepository implements UserProjectRepository {
  constructor(
    @InjectRepository(UserProjectEntity)
    private readonly usersRepository: Repository<UserProjectEntity>,
  ) {}

  async create(data: UserProject): Promise<UserProject> {
    const persistenceModel = UserProjectMapper.toPersistence(data);

    const newEntity = await this.usersRepository.save(
      this.usersRepository.create(persistenceModel),
    );
    return UserProjectMapper.toDomain(newEntity);
  }

  async findById(id: UserProject['id']): Promise<NullableType<UserProject>> {
    const entity = await this.usersRepository.findOne({
      where: { id },
    });

    return entity ? UserProjectMapper.toDomain(entity) : null;
  }

  async findByIds(ids: UserProject['id'][]): Promise<UserProject[]> {
    const entities = await this.usersRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((user) => UserProjectMapper.toDomain(user));
  }

  async update(
    id: UserProject['id'],
    payload: Partial<UserProject>,
  ): Promise<UserProject> {
    const entity = await this.usersRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('UserProject not found');
    }

    const updatedEntity = await this.usersRepository.save(
      this.usersRepository.create(
        UserProjectMapper.toPersistence({
          ...UserProjectMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return UserProjectMapper.toDomain(updatedEntity);
  }

  async remove(id: UserProject['id']): Promise<void> {
    await this.usersRepository.softDelete(id);
  }
}
