import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateHouseDto {
  @ApiProperty({ example: 'My house', type: String })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: `My house description`,
    type: String,
    nullable: true,
  })
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'My house address',
    type: String,
    nullable: true,
  })
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'My house overRentalFee',
    type: String,
    nullable: true,
  })
  @IsOptional()
  overRentalFee?: string;
}
