import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ProjectDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}
