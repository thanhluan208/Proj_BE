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

  @ApiProperty({ example: '2024-01-01' })
  @IsOptional()
  paymentDate?: Date;
}
