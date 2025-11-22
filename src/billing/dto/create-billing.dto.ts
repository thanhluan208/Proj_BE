import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateBillingDto {
  @ApiProperty({ example: 'uuid-of-tenant' })
  @IsNotEmpty()
  @IsUUID()
  tenantId: string;

  @ApiProperty({ example: '2023-10-01' })
  @IsNotEmpty()
  @IsDateString()
  month: Date;

  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  electricity_start_index: number;

  @ApiProperty({ example: 150 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  electricity_end_index: number;

  @ApiProperty({ example: 50 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  water_start_index: number;

  @ApiProperty({ example: 60 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  water_end_index: number;
}
