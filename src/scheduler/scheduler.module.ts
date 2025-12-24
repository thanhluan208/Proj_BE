import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { SchedulerRepository } from './scheduler.repository';
import { SchedulerEntity } from './scheduler.entity';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SchedulerEntity]),
    ScheduleModule.forRoot(),
    BillingModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService, SchedulerRepository],
  exports: [SchedulerService, SchedulerRepository],
})
export class SchedulerModule {}
