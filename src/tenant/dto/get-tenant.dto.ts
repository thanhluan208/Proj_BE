import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/utils/dto/pagination.dto';

export class GetTenantDto extends PaginationDto {
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
    required: false,
    description: 'Filter by status name (e.g., Active, Inactive)',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Filter by created date from (ISO string)',
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Filter by created date to (ISO string)',
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Search by tenant name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
