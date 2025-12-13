import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import { BillingStatusEnum } from '../billing-status.enum';

export class GetBillingDto extends PaginationDto {
  @ApiProperty({
    type: String,
    description: 'The ID of the room ',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  room: string;

  @ApiProperty({
    enum: BillingStatusEnum,
    description: 'The status of the room ',
    example: 'active',
  })
  @IsOptional()
  @IsEnum(BillingStatusEnum)
  status?: BillingStatusEnum;

  @ApiProperty({
    type: Date,
    description: 'The ID of the room ',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsDateString()
  from?: Date;

  @ApiProperty({
    type: Date,
    description: 'The ID of the room ',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsDateString()
  to?: Date;
}
