import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ type: [String] })
  @IsNotEmpty()
  user_ids: string[];

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  project_id: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  role?: string;
}
