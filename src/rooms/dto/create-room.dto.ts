import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: '101', type: String })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    description: 'The ID of the house ',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  house: string;

  @ApiProperty({
    example: `101 description`,
    type: String,
    nullable: true,
  })
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 20.5,
    type: Number,
    description: 'Room size in square meters',
  })
  @IsNumber()
  size_sq_m: number;
}
