import { ApiProperty } from '@nestjs/swagger';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'scheduler',
})
export class SchedulerEntity extends EntityRelationalHelper {
  @ApiProperty({
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: String,
    example: 'send-monthly-invoice',
    description: 'Name of the scheduled job',
  })
  @Column({ type: String })
  name: string;

  @ApiProperty({
    type: String,
    example: '0 0 1 * *',
    description: 'Cron expression for scheduling',
  })
  @Column({ type: String })
  cronExpression: string;

  @ApiProperty({
    type: String,
    example: 'Send monthly invoices to all tenants',
    description: 'Description of the job',
  })
  @Column({ type: String, nullable: true })
  description?: string;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether the job is active',
  })
  @Column({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({
    type: String,
    description: 'Additional metadata for the job in JSON format',
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty()
  @DeleteDateColumn()
  deletedAt: Date;
}
