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

  @ApiProperty({
    type: String,
    description: 'Phone number of the tenant',
    example: '0909090909',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    type: String,
    description: 'Citizen ID of the tenant',
    example: '123456789012',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  citizenId?: string;

  @ApiProperty({
    type: String,
    description: 'Gender of the tenant',
    example: 'Male',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  sex?: string;

  @ApiProperty({
    type: String,
    description: 'Nationality of the tenant',
    example: 'Vietnamese',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiProperty({
    type: String,
    description: 'Home town of the tenant',
    example: 'Hanoi',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  home?: string;

  @ApiProperty({
    type: String,
    description: 'Issue date of the citizen ID',
    example: '2020-01-01',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiProperty({
    type: String,
    description: 'Issue location of the citizen ID',
    example: 'Hanoi',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  issueLoc?: string;

  @ApiProperty({
    type: String,
    description: 'Job of the tenant',
    example: 'Software Engineer',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  tenantJob?: string;

  @ApiProperty({
    type: String,
    description: 'Workplace of the tenant',
    example: 'Google',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  tenantWorkAt?: string;
}
