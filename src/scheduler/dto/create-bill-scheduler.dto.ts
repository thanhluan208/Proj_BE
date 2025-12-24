import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BillingTypeEnum } from 'src/billing/billing-status.enum';

export class CreateBillSchedulerDto {
  @ApiProperty({
    type: String,
    description:
      'RRule string representation for the recurring schedule (e.g., DTSTART:20251224T000000\\nRRULE:FREQ=MONTHLY;BYMONTHDAY=1;COUNT=12)',
    example: 'DTSTART:20251224T000000\nRRULE:FREQ=MONTHLY;BYMONTHDAY=1',
  })
  @IsNotEmpty()
  @IsString()
  rule: string;

  @ApiProperty({
    type: String,
    description: 'The ID of the room for which bills will be generated',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @ApiProperty({
    enum: BillingTypeEnum,
    description: 'Type of billing (RECURRING or USAGE_BASED)',
    example: BillingTypeEnum.RECURRING,
  })
  @IsEnum(BillingTypeEnum)
  @IsNotEmpty()
  type: BillingTypeEnum;
}
