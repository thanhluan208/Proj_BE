import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class HouseInfo {
  @ApiProperty({
    type: String,
    description: 'The address of the house',
    example: '123 Main St',
    required: false,
  })
  @IsOptional()
  @IsString()
  houseAddress?: string;

  @ApiProperty({
    type: String,
    description: 'The owner of the house',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  houseOwner?: string;

  @ApiProperty({
    type: String,
    description: 'The owner of the house',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  houseOwnerPhoneNumber?: string;

  @ApiProperty({
    type: String,
    description: 'The owner of the house',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  houseOwnerBackupPhoneNumber?: string;
}

class BankInfo {
  @ApiProperty({
    type: String,
    description: 'The owner of the house',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @ApiProperty({
    type: String,
    description: 'The owner of the house',
    example: 'John Doe',
    required: false,
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsNumberString()
  bankAccountNumber?: string;

  @ApiProperty({
    type: String,
    description: 'The owner of the house',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankName?: string;
}

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

  @ValidateNested()
  @Type(() => HouseInfo)
  houseInfo: HouseInfo;

  @ValidateNested()
  @Type(() => BankInfo)
  bankInfo: BankInfo;
}
