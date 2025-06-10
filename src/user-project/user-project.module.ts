import { Module } from '@nestjs/common';
import { RelationalUserProjectPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { UserProjectController } from './user-project.controller';
import { UserProjectService } from './user-project.service';

@Module({
  imports: [RelationalUserProjectPersistenceModule],
  controllers: [UserProjectController],
  providers: [UserProjectService],
  exports: [UserProjectService, RelationalUserProjectPersistenceModule],
})
export class UserProjectModule {}
