import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    type: String,
    description: 'The ID of the room ',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  room: string;

  @ApiProperty({
    type: String,
    description: 'The ID of the house ',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  house: string;

  @ApiProperty({
    type: String,
    description: 'The full name of the tenant',
    example: 'Nguyen Van A',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Date of birth of the tenant',
    example: '1990-01-01',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiProperty({
    type: String,
    description: 'Address of the tenant',
    example: '123 Main Street, District 1, Ho Chi Minh City',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  address?: string;
}
