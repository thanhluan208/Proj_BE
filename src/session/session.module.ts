import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionService } from './session.service';
import { SessionEntity } from './session.entity';
import { SessionRepository } from './session.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity])],
  providers: [SessionService, SessionRepository],
  exports: [SessionService],
})
export class SessionModule {}
