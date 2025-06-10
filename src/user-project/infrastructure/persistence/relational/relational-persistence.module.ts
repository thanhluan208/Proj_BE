import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProjectRepository } from '../user-project-repository';
import { UserProjectEntity } from './entities/user-project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProjectEntity])],
  providers: [
    {
      provide: UserProjectRepository,
      useClass: RelationalUserProjectPersistenceModule,
    },
  ],
  exports: [UserProjectRepository],
})
export class RelationalUserProjectPersistenceModule {}
