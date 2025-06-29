import { ApiProperty } from '@nestjs/swagger';
import { StatusEntity } from 'src/statuses/status.entity';
import { RoomEntity } from 'src/rooms/room.entity';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'tenant',
})
export class TenantEntity extends EntityRelationalHelper {
  @ApiProperty({
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => RoomEntity,
  })
  @ManyToOne(() => RoomEntity, {
    eager: true,
  })
  room: RoomEntity;

  @ApiProperty({
    type: String,
    example: 'Nguyen Van A',
  })
  @Index()
  @Column({ type: String })
  name: string;

  @ApiProperty({
    type: Date,
    nullable: true,
    required: false,
  })
  @Column({ type: Date, nullable: true })
  dob?: Date;

  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  address?: string;

  @ApiProperty({
    type: () => StatusEntity,
  })
  @ManyToOne(() => StatusEntity, {
    eager: true,
  })
  status?: StatusEntity;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty()
  @DeleteDateColumn()
  deletedAt: Date;
}
