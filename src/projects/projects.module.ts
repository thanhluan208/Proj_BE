import { Module } from '@nestjs/common';
import { UserProjectModule } from 'src/user-project/user-project.module';
import { UsersModule } from 'src/users/users.module';
import { RelationalProjectPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [UsersModule, UserProjectModule, RelationalProjectPersistenceModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, RelationalProjectPersistenceModule],
})
export class ProjectsModule {}
