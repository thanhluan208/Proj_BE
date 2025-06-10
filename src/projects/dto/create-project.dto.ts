import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Project 101', type: String })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: `Project's description`, type: String })
  @IsOptional()
  description?: string;

  @ApiProperty({ type: Date })
  @IsOptional()
  startAt?: Date;

  @ApiProperty({ type: Date })
  @IsOptional()
  endAt?: Date;
}
