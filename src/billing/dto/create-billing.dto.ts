import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { BillingTypeEnum } from '../billing-status.enum';
export class CreateBillingDto {
  @ApiProperty({
    type: String,
    description: 'The ID of the room',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @ApiProperty({ example: '2023-10-01' })
  @IsNotEmpty()
  @IsDateString()
  from: Date;

  @ApiProperty({ example: '2023-10-01' })
  @IsNotEmpty()
  @IsDateString()
  to: Date;

  @ApiProperty({ example: 'Note!' })
  @IsOptional()
  @IsString()
  notes: string;

  @ApiProperty({ example: BillingTypeEnum.USAGE_BASED })
  @IsEnum(BillingTypeEnum)
  type: BillingTypeEnum;

  @ValidateIf((o) => o.type === BillingTypeEnum.USAGE_BASED)
  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  electricity_start_index: number;

  @ValidateIf((o) => o.type === BillingTypeEnum.USAGE_BASED)
  @ApiProperty({ example: 150 })
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  electricity_end_index: number;

  @ValidateIf((o) => o.type === BillingTypeEnum.USAGE_BASED)
  @ApiProperty({ example: 50 })
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  water_start_index: number;

  @ValidateIf((o) => o.type === BillingTypeEnum.USAGE_BASED)
  @ApiProperty({ example: 60 })
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  water_end_index: number;
}
