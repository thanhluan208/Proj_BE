import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateHouseExpenseDto {
  @ApiProperty({ type: String })
  @IsUUID()
  @IsNotEmpty()
  houseId: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  amount: number;

  @ApiProperty({ type: String, example: '2025-01-15' })
  @IsDateString()
  date: string;
}
