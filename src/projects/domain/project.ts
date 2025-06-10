import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../statuses/domain/status';

export class Project {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'Project101',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: `Project101's description`,
  })
  description: string | null;

  @ApiProperty({
    type: Number,
    example: 75.5,
    description:
      'Project progress as a decimal number with 2 decimal places (0-100)',
  })
  progress: number | null;

  @ApiProperty({
    type: () => Status,
  })
  status?: Status;

  @ApiProperty({
    type: Date,
  })
  startAt: Date;

  @ApiProperty({
    type: Date,
  })
  endAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
