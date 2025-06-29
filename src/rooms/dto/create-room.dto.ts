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
    example: 5000000,
    type: Number,
    description: 'Room price in VND',
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    example: 200000,
    type: Number,
    description: 'Electronic fee in VND',
  })
  @IsNumber()
  electronic_fee: number;

  @ApiProperty({
    example: 150000,
    type: Number,
    description: 'Water fee in VND',
  })
  @IsNumber()
  water_fee: number;

  @ApiProperty({
    example: 300000,
    type: Number,
    description: 'Living fee in VND',
  })
  @IsNumber()
  living_fee: number;

  @ApiProperty({
    example: 100000,
    type: Number,
    description: 'Other fees in VND',
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  other_fee?: number;
}
