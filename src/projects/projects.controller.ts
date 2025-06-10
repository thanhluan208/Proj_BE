import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Project } from './domain/project';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@ApiBearerAuth()
@ApiTags('projects')
@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiCreatedResponse({
    type: Project,
  })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(@Request() request, @Body() body: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(body, request.user);
  }
}
