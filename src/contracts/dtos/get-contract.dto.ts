import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/utils/dto/pagination.dto';

export class GetContractDto extends PaginationDto {
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
    description: 'The status of the room ',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  status: string;
}
