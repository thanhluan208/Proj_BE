import { Injectable } from '@nestjs/common';
import { CreateUserProjectDto } from './dto/create-user-project.dto';
import { UserProjectRepository } from './infrastructure/persistence/user-project-repository';
import { PaginationOptions } from './infrastructure/persistence/user-project-repository';

@Injectable()
export class UserProjectService {
  constructor(private userProjectRepository: UserProjectRepository) {}

  create(createUserProjectDto: CreateUserProjectDto) {
    return this.userProjectRepository.create(createUserProjectDto);
  }

  findById(id: string) {
    return this.userProjectRepository.findById(id);
  }

  findByUser(user_id: string, options?: PaginationOptions) {
    return this.userProjectRepository.findByUser(user_id, options);
  }

  countByUser(user_id: string) {
    return this.userProjectRepository.countByUser(user_id);
  }
}
