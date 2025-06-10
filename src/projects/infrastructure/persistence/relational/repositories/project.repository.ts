import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Project } from 'src/projects/domain/project';
import { NullableType } from 'src/utils/types/nullable.type';
import { In, Repository } from 'typeorm';
import { ProjectRepository } from '../../project.repository';
import { ProjectEntity } from '../entities/project.entity';
import { ProjectMapper } from '../mappers/project.mapper';

@Injectable()
export class ProjectRelationalRepository implements ProjectRepository {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
  ) {}

  async create(data: Project): Promise<Project> {
    const persistenceModel = ProjectMapper.toPersistence(data);

    const newEntity = await this.projectRepository.save(
      this.projectRepository.create(persistenceModel),
    );
    return ProjectMapper.toDomain(newEntity);
  }

  async findById(id: Project['id']): Promise<NullableType<Project>> {
    const entity = await this.projectRepository.findOne({
      where: { id },
    });

    return entity ? ProjectMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Project['id'][]): Promise<Project[]> {
    const entities = await this.projectRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((user) => ProjectMapper.toDomain(user));
  }

  async update(id: Project['id'], payload: Partial<Project>): Promise<Project> {
    const entity = await this.projectRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Project not found');
    }

    const updatedEntity = await this.projectRepository.save(
      this.projectRepository.create(
        ProjectMapper.toPersistence({
          ...ProjectMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return ProjectMapper.toDomain(updatedEntity);
  }

  async remove(id: Project['id']): Promise<void> {
    await this.projectRepository.softDelete(id);
  }
}
