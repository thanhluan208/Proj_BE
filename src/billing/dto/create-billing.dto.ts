import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateBillingDto {
  @ApiProperty({
    type: String,
    description: 'The ID of the tenant',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  tenantId: string;

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
