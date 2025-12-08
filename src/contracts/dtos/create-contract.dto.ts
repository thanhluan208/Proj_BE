import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
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
}
