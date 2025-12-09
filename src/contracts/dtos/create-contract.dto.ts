import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
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

  @ApiProperty({
    type: String,
    description: 'The owner of the house',
    example: 'John Doe',
    required: false,
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsNumberString()
  overRentalFee?: string;
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

class FeeInfo {
  @ApiProperty({
    example: 5000000,
    type: Number,
    description: 'Base rent in VND',
  })
  @IsNumber()
  base_rent: number;

  @ApiProperty({ example: 3000 })
  @IsOptional()
  @IsNumber()
  price_per_electricity_unit?: number;

  @ApiProperty({ example: 10000 })
  @IsOptional()
  @IsNumber()
  price_per_water_unit?: number;

  @ApiProperty({ example: 50000 })
  @IsOptional()
  @IsNumber()
  fixed_water_fee?: number;

  @ApiProperty({ example: 50000 })
  @IsOptional()
  @IsNumber()
  fixed_electricity_fee?: number;

  @ApiProperty({ example: 100000 })
  @IsOptional()
  @IsNumber()
  living_fee?: number;

  @ApiProperty({ example: 100000 })
  @IsOptional()
  @IsNumber()
  parking_fee?: number;

  @ApiProperty({ example: 50000 })
  @IsOptional()
  @IsNumber()
  cleaning_fee?: number;

  @ApiProperty({ example: 100000 })
  @IsOptional()
  @IsNumber()
  internet_fee?: number;
}
export class CreateContractDto {
  @ApiProperty({
    type: String,
    description: 'The ID of the room',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @ApiProperty({
    type: String,
    description: 'The created day of the contract',
    example: '2024-01-01',
  })
  @IsDateString()
  createdDate: string;

  @ApiProperty({
    type: [String],
    description: 'List of tenant IDs',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsString({ each: true })
  tenants: string[];

  @ApiProperty({
    type: String,
    description: 'The created day of the contract',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    type: String,
    description: 'The created day of the contract',
    example: '2024-01-01',
  })
  @IsDateString()
  endDate: string;

  @ValidateNested()
  @Type(() => HouseInfo)
  houseInfo: HouseInfo;

  @ValidateNested()
  @Type(() => BankInfo)
  bankInfo: BankInfo;

  @ValidateNested()
  @Type(() => FeeInfo)
  feeInfo: FeeInfo;
}
