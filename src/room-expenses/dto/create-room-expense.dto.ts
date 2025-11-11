import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRoomExpenseDto {
  @ApiProperty({ type: String, description: 'Room ID' })
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ type: String, example: 'light bulb replacement' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: Number, example: 50000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ type: String, example: '2025-06-01' })
  @IsDateString()
  date: string;
}
