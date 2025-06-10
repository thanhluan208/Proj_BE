import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { Project } from 'src/projects/domain/project';
import { Status } from 'src/statuses/domain/status';
import { User } from 'src/users/domain/user';

export class CreateUserProjectDto {
  @Type(() => User)
  user: User;

  @Type(() => Project)
  project: Project;

  @IsOptional()
  @Type(() => Status)
  status: Status;

  @Type(() => User)
  addedBy?: User;

  @IsOptional()
  @IsDate()
  joinedAt?: Date;

  @IsOptional()
  @IsString()
  role?: string;
}
