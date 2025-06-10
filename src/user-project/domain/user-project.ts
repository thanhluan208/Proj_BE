import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Status } from '../../statuses/domain/status';

@Expose({ groups: ['me'] })
export class UserProject {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'Backend Developer',
  })
  role: string;

  @ApiProperty({
    type: Date,
  })
  joinedAt: Date;

  @ApiProperty({
    type: () => Status,
  })
  status?: Status;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
