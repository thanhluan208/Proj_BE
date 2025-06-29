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
}
