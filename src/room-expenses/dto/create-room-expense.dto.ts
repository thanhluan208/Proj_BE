import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  ValidateNested,
  IsArray,
  IsNumberString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class Expense {
  @ApiProperty({
    type: String,
    example: 'Light bulb replacement',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: Number,
    example: 50000,
  })
  @IsNumberString()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    type: String,
    example: 'Light bulb replacement',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: String,
    example: 'Light bulb replacement',
  })
  @IsOptional()
  @IsBoolean()
  hasFile?: boolean;

  @ApiProperty({
    type: String,
    example: '2025-06-01',
    format: 'date',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Payment proof file (image or PDF)',
    required: true,
  })
  receipt?: Express.Multer.File;
}

export class CreateRoomExpenseDto {
  @ApiProperty({
    type: String,
    description: 'Room ID',
    example: 'aab67484-6fdc-4573-942c-1a1f266cb1c8',
  })
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({
    type: [Expense],
    description: 'List of expenses for the room',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Expense)
  expenses: Expense[];
}

export class EditRoomExpenseDto extends Expense {
  @ApiProperty({
    type: String,
    description: 'Room ID',
    example: 'aab67484-6fdc-4573-942c-1a1f266cb1c8',
  })
  @IsUUID()
  @IsNotEmpty()
  roomId: string;
}
