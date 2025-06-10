import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProjectRepository } from '../user-project-repository';
import { UserProjectEntity } from './entities/user-project.entity';
import { UsersProjectRelationalRepository } from './repositories/user-project-repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserProjectEntity])],
  providers: [
    {
      provide: UserProjectRepository,
      useClass: UsersProjectRelationalRepository,
    },
  ],
  exports: [UserProjectRepository],
})
export class RelationalUserProjectPersistenceModule {}
