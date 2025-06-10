import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Project } from './domain/project';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import { AddMemberDto } from './dto/add-member.dto';
import { PaginationDto } from './dto/pagination.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';

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

  @ApiOkResponse()
  @Post('add-member')
  @HttpCode(HttpStatus.OK)
  addMembers(@Request() request, @Body() body: AddMemberDto): Promise<void> {
    return this.projectsService.addMemberToProject(body, request.user);
  }

  @ApiCreatedResponse({
    type: PaginatedResponseDto<Project>,
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  findByUser(
    @Request() request,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Project>> {
    return this.projectsService.findByUser(request.user.id, paginationDto);
  }
}
