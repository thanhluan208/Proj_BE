import { Injectable, Logger } from '@nestjs/common';
import { ProjectRepository } from './infrastructure/persistence/project.repository';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private projectsRepository: ProjectRepository) {}
}
