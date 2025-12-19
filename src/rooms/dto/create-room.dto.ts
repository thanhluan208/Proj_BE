import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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
  @Transform(({ value }) => Number(value))
  @IsNumber()
  size_sq_m: number;

  @ApiProperty({
    example: 2,
    type: Number,
    description: 'Max tenant in one room',
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  maxTenant?: number;
}
