import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  Length,
} from 'class-validator';
import { AuthProvidersEnum } from '../auth-providers.enum';

export class AuthRegisterLoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description:
      'User password - must contain uppercase, lowercase, number and special character',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    minLength: 1,
    maxLength: 100,
  })
  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  @Length(1, 100, { message: 'Full name must be between 1 and 100 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message:
      'Full name can only contain letters, spaces, hyphens and apostrophes',
  })
  fullName: string;

  @ApiProperty({
    example: AuthProvidersEnum.email,
    description: 'Authentication provider',
    required: false,
  })
  @IsOptional()
  @IsString()
  provider?: string;

  // Additional validation for property management context
  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number for property management communications',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value?.replace(/\s+/g, '')) // Remove spaces
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number',
  })
  phoneNumber?: string;
}
