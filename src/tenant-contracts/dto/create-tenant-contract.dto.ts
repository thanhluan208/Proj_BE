import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTenantContractDto {
  @ApiProperty({
    type: String,
    description: 'Contract ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  contractId: string;

  @ApiProperty({
    type: String,
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @ApiProperty({
    type: Boolean,
    description: 'Is Main Tenant',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isMainTenant?: boolean;
}
