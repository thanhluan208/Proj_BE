import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './entities/project.entity';
import { ProjectRepository } from '../project.repository';
import { ProjectRelationalRepository } from './repositories/project.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity])],
  providers: [
    {
      provide: ProjectRepository,
      useClass: ProjectRelationalRepository,
    },
  ],
  exports: [ProjectRepository],
})
export class RelationalProjectPersistenceModule {}
