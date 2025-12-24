import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateSchedulerDto {
  @ApiProperty({
    example: 'send-monthly-invoice',
    description: 'Name of the scheduled job',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '0 0 1 * *',
    description:
      'Cron expression for scheduling (e.g., "0 0 1 * *" for monthly)',
  })
  @IsString()
  @IsNotEmpty()
  cronExpression: string;

  @ApiProperty({
    example: 'Send monthly invoices to all tenants',
    description: 'Description of the job',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the job is active',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: { type: 'billing', action: 'generate_invoice' },
    description: 'Additional metadata for the job',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
