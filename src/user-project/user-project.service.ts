import { Injectable } from '@nestjs/common';
import { CreateUserProjectDto } from './dto/create-user-project.dto';
import { UserProjectRepository } from './infrastructure/persistence/user-project-repository';

@Injectable()
export class UserProjectService {
  constructor(private userProjectRepository: UserProjectRepository) {}

  create(createUserProjectDto: CreateUserProjectDto) {
    return this.userProjectRepository.create(createUserProjectDto);
  }
}
