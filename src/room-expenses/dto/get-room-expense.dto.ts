import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { PaginationDto } from 'src/utils/dto/pagination.dto';

export enum ComparisonEnum {
  BIGGER = 'bigger',
  SMALLER = 'smaller',
}

export class GetRoomExpensesDto extends PaginationDto {
  @ApiProperty({
    type: String,
    example: 'uuid',
  })
  @IsNotEmpty()
  @IsString()
  room: string;

  @ApiPropertyOptional({
    type: String,
    example: '2024-01-01',
    description: 'Filter expenses from this date',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2024-12-31',
    description: 'Filter expenses to this date',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Electric bill',
    description: 'Search by expense name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1000,
    description: 'Filter by amount',
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({
    enum: ComparisonEnum,
    example: ComparisonEnum.BIGGER,
    description: 'Comparison operator for amount filter',
  })
  @IsOptional()
  @IsEnum(ComparisonEnum)
  comparison?: ComparisonEnum;
}
