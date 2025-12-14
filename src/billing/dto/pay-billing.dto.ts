import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class PayBillingDto {
  @ApiProperty({
    type: Date,
    description: 'Payment date',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsDateString()
  paymentDate: Date;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Payment proof file (image or PDF)',
    required: true,
  })
  proof?: Express.Multer.File;
}
