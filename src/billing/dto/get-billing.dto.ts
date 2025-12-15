import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import { BillingStatusEnum } from '../billing-status.enum';
import { SortOrder } from 'src/utils/types/common.type';

export enum BillingSortField {
  createdAt = 'createdAt',
  electricity_usage = 'electricity_usage',
  water_usage = 'water_usage',
  total_amount = 'totalAmount',
  payment_date = 'paymentDate',
}

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

  @ApiPropertyOptional({
    enum: BillingSortField,
    example: BillingSortField.createdAt,
    description: 'Primary field to sort expenses',
  })
  @IsOptional()
  @IsEnum(BillingSortField)
  sortBy?: BillingSortField;

  @ApiPropertyOptional({
    enum: SortOrder,
    example: SortOrder.DESC,
    description: 'Sort direction (ASC or DESC)',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
