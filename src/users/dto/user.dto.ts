import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UserDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}
