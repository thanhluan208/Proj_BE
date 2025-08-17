import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';

/**
 * Data Transfer Object for email confirmation with OTP
 * Validates the email address and 6-digit OTP code
 */
export class ConfirmEmailDto {
  @ApiProperty({
    description: 'User email address that needs to be confirmed',
    example: 'user@example.com',
    type: String,
  })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '6-digit OTP code sent to the user email',
    example: '123456',
    type: String,
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, {
    message: 'OTP code must be exactly 6 digits',
  })
  @Matches(/^\d{6}$/, {
    message: 'OTP code must contain only numbers',
  })
  otpCode: string;
}

/**
 * Data Transfer Object for resending OTP
 * Only requires email address for resend requests
 */
export class ResendOtpDto {
  @ApiProperty({
    description: 'User email address to resend OTP to',
    example: 'user@example.com',
    type: String,
  })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

/**
 * Response DTO for resend OTP operation
 * Includes rate limiting information
 */
export class ResendOtpResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  status: number;

  @ApiProperty({
    description: 'Response message',
    example: 'New verification code sent. You have 2 attempts remaining.',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing wait time information',
    type: 'object',
    properties: {
      waitTime: {
        type: 'number',
        description: 'Wait time in seconds before next resend attempt',
        example: 0,
      },
    },
  })
  data: {
    waitTime: number;
  };
}

/**
 * Response DTO for OTP status check (debugging/monitoring)
 */
export class OtpStatusResponseDto {
  @ApiProperty({
    description: 'Whether user has an active OTP',
    example: true,
  })
  hasOtp: boolean;

  @ApiProperty({
    description: 'Time to live for current OTP in seconds',
    example: 285,
  })
  otpTtl: number;

  @ApiProperty({
    description: 'Number of resend attempts made',
    example: 1,
  })
  resendAttempts: number;

  @ApiProperty({
    description: 'Cooldown time remaining in seconds',
    example: 0,
  })
  cooldownTtl: number;

  @ApiProperty({
    description: 'Whether user can request resend',
    example: true,
  })
  canResend: boolean;
}
