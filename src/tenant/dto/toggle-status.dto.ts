import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum TenantStatus {
  ACTIVE = 1,
  INACTIVE = 2,
}

export class ToggleStatusDto {
  @ApiProperty({
    enum: TenantStatus,
    description: 'The status to set for the tenant',
    example: TenantStatus.ACTIVE,
  })
  @IsEnum(TenantStatus)
  status: TenantStatus;
}
