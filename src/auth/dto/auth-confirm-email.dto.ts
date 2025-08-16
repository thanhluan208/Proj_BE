import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class AuthConfirmEmailDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Email confirmation hash token',
  })
  @IsString({ message: 'Hash must be a string' })
  @IsNotEmpty({ message: 'Confirmation hash is required' })
  @Length(10, 1000, { message: 'Invalid confirmation hash format' })
  hash: string;
}
