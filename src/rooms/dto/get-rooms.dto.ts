import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationDto } from 'src/utils/dto/pagination.dto';

export class GetRoomsDto extends PaginationDto {
  @ApiProperty({
    type: String,
    description: 'The ID of the house ',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  house: string;
}
