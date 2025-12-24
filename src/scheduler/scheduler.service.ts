import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SchedulerRepository } from './scheduler.repository';
import { SchedulerEntity } from './scheduler.entity';
import { RRule } from 'rrule';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { CreateBillSchedulerDto } from './dto/create-bill-scheduler.dto';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { BillingService } from 'src/billing/billing.service';
import { BillingTypeEnum } from 'src/billing/billing-status.enum';
import { CreateBillingDto } from 'src/billing/dto/create-billing.dto';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly schedulerRepository: SchedulerRepository,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly billingService: BillingService,
  ) {}

  /**
   * Called when the module is initialized
   * Loads all active scheduled jobs from the database
   */
  async onModuleInit() {
    this.logger.log('Initializing scheduler module...');
    await this.loadScheduledJobsFromDatabase();
  }

  /**
   * Load all active scheduled jobs from the database and register them
   */
  async loadScheduledJobsFromDatabase() {
    try {
      const activeJobs = await this.schedulerRepository.findActiveJobs();
      this.logger.log(`Found ${activeJobs.length} active scheduled jobs`);

      for (const job of activeJobs) {
        await this.registerCronJob(job);
      }

      this.logger.log('All scheduled jobs loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load scheduled jobs from database', error);
    }
  }

  /**
   * Register a cron job with the scheduler
   */
  async registerCronJob(jobEntity: SchedulerEntity) {
    try {
      // Check if job already exists
      const existingJob = this.schedulerRegistry.getCronJob(jobEntity.id);
      if (existingJob) {
        this.logger.warn(`Job ${jobEntity.name} already exists, skipping...`);
        return;
      }
    } catch (error) {
      // Job doesn't exist, continue with registration
    }

    try {
      const job = new CronJob(jobEntity.cronExpression, async () => {
        await this.executeJob(jobEntity);
      });

      this.schedulerRegistry.addCronJob(jobEntity.id, job);
      job.start();

      this.logger.log(
        `Registered cron job: ${jobEntity.name} (${jobEntity.cronExpression})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to register cron job: ${jobEntity.name}`,
        error,
      );
    }
  }

  /**
   * Execute a scheduled job
   */
  async executeJob(jobEntity: SchedulerEntity) {
    this.logger.log(`Executing job: ${jobEntity.name} (ID: ${jobEntity.id})`);

    try {
      // Check if this is a bill creation job
      if (jobEntity.metadata?.type && jobEntity.metadata?.roomId) {
        this.logger.log(
          `Detected bill creation job for room ${jobEntity.metadata.roomId} with type ${jobEntity.metadata.type}`,
        );
        await this.executeBillCreationJob(jobEntity);
      } else {
        // TODO: Implement other job types
        this.logger.log(`Job ${jobEntity.name} executed successfully`);
      }
    } catch (error) {
      this.logger.error(`Failed to execute job: ${jobEntity.name}`, error);
    }
  }

  /**
   * Execute bill creation job
   */
  private async executeBillCreationJob(jobEntity: SchedulerEntity) {
    const {
      roomId,
      type,
      rule,
      userId,
      timezone: userTimezone,
    } = jobEntity.metadata as {
      roomId: string;
      type: BillingTypeEnum;
      rule: string;
      userId: string;
      timezone?: string;
    };

    this.logger.log(
      `Starting bill creation for room ${roomId}, type: ${type}, timezone: ${userTimezone || 'UTC'}`,
    );
    try {
      // Calculate from and to dates
      const from = dayjs().toDate();
      const to = dayjs().add(1, 'month').toDate();

      this.logger.log(
        `Bill period: from ${dayjs(from).format('YYYY-MM-DD')} to ${dayjs(to).format('YYYY-MM-DD')}`,
      );

      // Create bill DTO based on type
      const billDto: any = {
        roomId,
        type,
        from,
        to,
        notes: 'Create automatically by you butler',
      };

      // Add index fields only for USAGE_BASED type
      if (type === BillingTypeEnum.USAGE_BASED) {
        billDto.electricity_start_index = 0;
        billDto.electricity_end_index = 0;
        billDto.water_start_index = 0;
        billDto.water_end_index = 0;
      }

      this.logger.log(`Creating bill with DTO:`, billDto);

      // Create the bill
      const bill = await this.billingService.create(
        billDto as CreateBillingDto,
        {
          id: userId,
        } as any,
      );

      this.logger.log(
        `Bill created successfully with ID: ${bill.id} for room ${roomId}`,
      );

      // Check if this is the last execution
      if (rule) {
        this.logger.log(
          `Checking if this is the last execution for job ${jobEntity.id}`,
        );
        const rrule = RRule.fromString(rule);
        const now = new Date();
        const nextOccurrence = rrule.after(now, false);

        if (!nextOccurrence) {
          this.logger.log(
            `No more occurrences found for job ${jobEntity.id}. Deactivating scheduler...`,
          );
          await this.updateCronJob(jobEntity.id, { isActive: false });
          this.logger.log(`Scheduler ${jobEntity.id} deactivated successfully`);
        } else {
          this.logger.log(
            `Next occurrence scheduled for: ${dayjs(nextOccurrence).format('YYYY-MM-DD HH:mm:ss')}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to create bill for room ${roomId}, type ${type}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create a bill scheduler
   */
  async createBillScheduler(
    dto: CreateBillSchedulerDto,
    user: JwtPayloadType,
    timezone: string,
  ): Promise<SchedulerEntity> {
    this.logger.log(
      `Creating bill scheduler for room ${dto.roomId}, type: ${dto.type}, timezone: ${timezone}`,
    );

    try {
      // Parse RRule to validate and get cron expression
      this.logger.log(`Parsing RRule: ${dto.rule}`);
      const rrule = RRule.fromString(dto.rule);

      // Convert RRule to cron expression with timezone conversion
      const cronExpression = this.convertRRuleToCron(rrule, timezone);
      this.logger.log(`Generated cron expression: ${cronExpression}`);

      // Check for existing active schedulers of the same type for this room
      this.logger.log(
        `Checking for existing active schedulers for room ${dto.roomId} with type ${dto.type}`,
      );
      const existingSchedulers =
        await this.schedulerRepository.findActiveByRoomAndType(
          dto.roomId,
          dto.type,
        );

      if (existingSchedulers.length > 0) {
        this.logger.log(
          `Found ${existingSchedulers.length} existing scheduler(s). Deactivating them...`,
        );
        for (const scheduler of existingSchedulers) {
          await this.removeCronJob(scheduler.id);
          this.logger.log(`Deactivated scheduler ${scheduler.id}`);
        }
      }

      // Create the scheduler
      const schedulerName = `bill-${dto.type.toLowerCase()}-${dto.roomId}`;
      this.logger.log(`Creating scheduler with name: ${schedulerName}`);

      const scheduler = await this.addCronJob({
        name: schedulerName,
        cronExpression,
        description: `Automated bill creation for room ${dto.roomId} (${dto.type}) in ${timezone}`,
        isActive: true,
        metadata: {
          roomId: dto.roomId,
          type: dto.type,
          rule: dto.rule,
          userId: user.id,
          timezone: timezone,
        },
      });

      this.logger.log(
        `Bill scheduler created successfully with ID: ${scheduler.id}`,
      );

      return scheduler;
    } catch (error) {
      this.logger.error(
        `Failed to create bill scheduler for room ${dto.roomId}`,
        error,
      );
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: `Failed to create bill scheduler: ${error.message}`,
      });
    }
  }

  /**
   * Convert RRule to cron expression
   * Converts the time from user's timezone to server's timezone (UTC)
   */
  private convertRRuleToCron(rrule: RRule, userTimezone: string): string {
    this.logger.log(
      `Converting RRule to cron expression (user timezone: ${userTimezone})`,
    );

    const options = rrule.options;

    // Handle monthly frequency
    if (options.freq === RRule.MONTHLY) {
      const dayOfMonth = options.bymonthday?.[0] || 1;
      const userHour = options.byhour?.[0] || 0;
      const userMinute = options.byminute?.[0] || 0;

      // Convert time from user timezone to server timezone (UTC)
      const { hour: serverHour, minute: serverMinute } =
        this.convertTimeToServerTimezone(userHour, userMinute, userTimezone);

      const cronExpr = `${serverMinute} ${serverHour} ${dayOfMonth} * *`;
      this.logger.log(
        `Converted MONTHLY RRule to cron: ${cronExpr} (day: ${dayOfMonth}, user time: ${userHour}:${userMinute} ${userTimezone} -> server time: ${serverHour}:${serverMinute} UTC)`,
      );
      return cronExpr;
    }

    // Handle daily frequency
    if (options.freq === RRule.DAILY) {
      const userHour = options.byhour?.[0] || 0;
      const userMinute = options.byminute?.[0] || 0;

      // Convert time from user timezone to server timezone (UTC)
      const { hour: serverHour, minute: serverMinute } =
        this.convertTimeToServerTimezone(userHour, userMinute, userTimezone);

      const cronExpr = `${serverMinute} ${serverHour} * * *`;
      this.logger.log(
        `Converted DAILY RRule to cron: ${cronExpr} (user time: ${userHour}:${userMinute} ${userTimezone} -> server time: ${serverHour}:${serverMinute} UTC)`,
      );
      return cronExpr;
    }

    // Handle weekly frequency
    if (options.freq === RRule.WEEKLY) {
      const dayOfWeek = options.byweekday?.[0] || 0;
      const userHour = options.byhour?.[0] || 0;
      const userMinute = options.byminute?.[0] || 0;

      // Convert time from user timezone to server timezone (UTC)
      const { hour: serverHour, minute: serverMinute } =
        this.convertTimeToServerTimezone(userHour, userMinute, userTimezone);

      const cronExpr = `${serverMinute} ${serverHour} * * ${dayOfWeek}`;
      this.logger.log(
        `Converted WEEKLY RRule to cron: ${cronExpr} (day: ${dayOfWeek}, user time: ${userHour}:${userMinute} ${userTimezone} -> server time: ${serverHour}:${serverMinute} UTC)`,
      );
      return cronExpr;
    }

    // Default: run at midnight on the 1st of every month
    this.logger.warn(
      `Unsupported RRule frequency: ${options.freq}. Using default: 0 0 1 * *`,
    );
    return '0 0 1 * *';
  }

  /**
   * Convert time from user's timezone to server's timezone (UTC)
   */
  private convertTimeToServerTimezone(
    hour: number,
    minute: number,
    userTimezone: string,
  ): { hour: number; minute: number } {
    this.logger.log(
      `Converting time ${hour}:${minute} from ${userTimezone} to UTC`,
    );

    // Create a date in the user's timezone with the specified time
    // Using a fixed date (2024-01-01) to calculate the time offset
    const userTime = dayjs.tz(
      `2024-01-01 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      userTimezone,
    );

    // Convert to UTC
    const serverTime = userTime.utc();

    this.logger.log(
      `Time conversion result: ${hour}:${minute} in ${userTimezone} -> ${serverTime.hour()}:${serverTime.minute()} UTC`,
    );

    return {
      hour: serverTime.hour(),
      minute: serverTime.minute(),
    };
  }

  /**
   * Add a new cron job dynamically
   */
  async addCronJob(
    jobData: Partial<SchedulerEntity>,
  ): Promise<SchedulerEntity> {
    const job = await this.schedulerRepository.create(jobData);

    if (job.isActive) {
      await this.registerCronJob(job);
    }

    return job;
  }

  /**
   * Remove a cron job
   */
  async removeCronJob(jobId: string): Promise<void> {
    try {
      const job = this.schedulerRegistry.getCronJob(jobId);
      if (job) {
        job.stop();
        this.schedulerRegistry.deleteCronJob(jobId);
        this.logger.log(`Removed cron job: ${jobId}`);
      }
    } catch (error) {
      this.logger.warn(`Job ${jobId} not found in registry`);
    }

    await this.schedulerRepository.softDelete(jobId);
  }

  /**
   * Update a cron job
   */
  async updateCronJob(
    jobId: string,
    jobData: Partial<SchedulerEntity>,
  ): Promise<SchedulerEntity | null> {
    const updatedJob = await this.schedulerRepository.update(jobId, jobData);

    if (!updatedJob) {
      return null;
    }

    // Remove old job and register new one if active
    await this.removeCronJob(jobId);

    if (updatedJob.isActive) {
      await this.registerCronJob(updatedJob);
    }

    return updatedJob;
  }
}
