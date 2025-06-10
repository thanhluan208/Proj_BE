import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { RelationalUserPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalUserPersistenceModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, RelationalUserPersistenceModule],
})
export class UsersModule {}
