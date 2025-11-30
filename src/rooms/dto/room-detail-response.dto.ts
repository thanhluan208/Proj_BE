import { ApiProperty } from '@nestjs/swagger';
import { RoomEntity } from '../room.entity';

export class RoomDetailResponseDto extends RoomEntity {
  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Total number of tenants in the room',
  })
  totalTenants: number;

  @ApiProperty({
    type: Number,
    example: 10000000,
    description: 'Total income from billings for the room',
  })
  totalIncome: number;

  @ApiProperty({
    type: Number,
    example: 500000,
    description: 'Total expenses for the room',
  })
  totalExpenses: number;
}
