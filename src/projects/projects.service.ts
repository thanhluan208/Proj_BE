import {
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ProjectRepository } from './infrastructure/persistence/project.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { Project } from './domain/project';
import { NullableType } from 'src/utils/types/nullable.type';
import { UserProjectService } from 'src/user-project/user-project.service';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { UserService } from 'src/users/users.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private projectsRepository: ProjectRepository,
    private userProjectService: UserProjectService,
    private userService: UserService,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    userJwtPayload: JwtPayloadType,
  ) {
    const newProjectEntity = await this.projectsRepository.create({
      ...createProjectDto,
      status: {
        id: StatusEnum.inactive,
      },
      progress: 0,
    });

    const currentUser = await this.userService.findById(userJwtPayload.id);

    if (!currentUser) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    await this.userProjectService.create({
      project: newProjectEntity,
      status: {
        id: StatusEnum.active,
      },
      user: currentUser,
      joinedAt: new Date(),
    });

    return newProjectEntity;
  }

  findById(id: Project['id']): Promise<NullableType<Project>> {
    return this.projectsRepository.findById(id);
  }
}
