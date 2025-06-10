import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { UserProjectService } from 'src/user-project/user-project.service';
import { UserService } from 'src/users/users.service';
import { NullableType } from 'src/utils/types/nullable.type';
import { Project } from './domain/project';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectRepository } from './infrastructure/persistence/project.repository';
import { AddMemberDto } from './dto/add-member.dto';
import { UserProject } from 'src/user-project/domain/user-project';
import { I18nContext } from 'nestjs-i18n';
import { PaginationDto } from './dto/pagination.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';

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
    this.logger.log(`Creating new project for user ${userJwtPayload.id}`);

    const newProjectEntity = await this.projectsRepository.create({
      ...createProjectDto,
      status: {
        id: StatusEnum.inactive,
      },
      progress: 0,
    });
    this.logger.log(`Project created with ID: ${newProjectEntity.id}`);

    const currentUser = await this.userService.findById(userJwtPayload.id);
    this.logger.log(
      `Retrieved current user: ${currentUser?.id || 'not found'}`,
    );

    if (!currentUser) {
      this.logger.error(`User not found with ID: ${userJwtPayload.id}`);
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
      role: 'owner',
    });
    this.logger.log(
      `User ${currentUser.id} added as member to project ${newProjectEntity.id}`,
    );

    return newProjectEntity;
  }

  async addMemberToProject(
    addMemberDto: AddMemberDto,
    userJwtPayload: JwtPayloadType,
  ) {
    this.logger.log(
      `Adding members to project ${addMemberDto.project_id} by user ${userJwtPayload.id}`,
    );

    const i18n = I18nContext.current();
    if (!i18n) {
      this.logger.error('Translation context not available');
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          message: 'Translation context not available',
        },
      });
    }

    const { project_id, user_ids, role } = addMemberDto;
    this.logger.log(`Adding users ${user_ids.join(', ')} with role ${role}`);

    const [addByUser, targetAddUsers] = await Promise.all([
      this.userService.findById(userJwtPayload.id),
      this.userService.findByIds(user_ids),
    ]);
    this.logger.log(
      `Retrieved ${targetAddUsers.length} target users and addBy user: ${addByUser?.id || 'not found'}`,
    );

    if (targetAddUsers.some((elm) => !elm.id) || !addByUser?.id) {
      this.logger.error('Invalid users found in the request');
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          message: i18n.t('project.errors.invalidUsers'),
        },
      });
    }

    const userProject = await this.userProjectService.findById(project_id);
    this.logger.log(
      `Retrieved project: ${userProject?.project.id || 'not found'}`,
    );

    if (!userProject) {
      this.logger.error(`Project not found with ID: ${project_id}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          message: i18n.t('project.errors.projectNotFound'),
        },
      });
    }

    if (userProject.role !== 'owner') {
      this.logger.error(
        `User ${userJwtPayload.id} with role ${userProject.role} attempted to add members to project ${project_id}`,
      );
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          message: i18n.t('project.errors.insufficientPermissions'),
        },
      });
    }

    if (user_ids.some((id) => userProject.user.id === id)) {
      this.logger.error(
        `Some users are already members of project ${project_id}`,
      );
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          message: i18n.t('project.errors.userAlreadyInProject'),
        },
      });
    }

    const pendings: Promise<UserProject>[] = [];
    for (let i = 0; i < user_ids.length; i++) {
      const currentUser = targetAddUsers.find((elm) => elm.id === user_ids[i]);

      if (!currentUser) {
        this.logger.warn(
          `User ${user_ids[i]} not found in target users, skipping`,
        );
        continue;
      }

      this.logger.log(`Adding user ${currentUser.id} to project ${project_id}`);
      pendings.push(
        this.userProjectService.create({
          project: userProject.project,
          status: {
            id: StatusEnum.active,
          },
          user: currentUser,
          addedBy: addByUser,
          joinedAt: new Date(),
          role,
        }),
      );
    }

    await Promise.all(pendings);
    this.logger.log(
      `Successfully added ${pendings.length} users to project ${project_id}`,
    );
  }

  async findByUser(
    user_id: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Project>> {
    this.logger.log(`Finding projects for user ${user_id}`);

    const currentUser = await this.userService.findById(user_id);
    this.logger.log(`Retrieved user: ${currentUser?.id || 'not found'}`);

    if (!currentUser) {
      this.logger.error(`User not found with ID: ${user_id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const [projects, total] = await Promise.all([
      this.userProjectService.findByUser(user_id, { skip, take: pageSize }),
      this.userProjectService.countByUser(user_id),
    ]);

    this.logger.log(`Found ${projects.length} projects for user ${user_id}`);

    return {
      data: projects,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: Project['id']): Promise<NullableType<Project>> {
    this.logger.log(`Finding project with ID: ${id}`);
    const project = await this.projectsRepository.findById(id);
    this.logger.log(`Project ${id} ${project ? 'found' : 'not found'}`);
    return project;
  }
}
