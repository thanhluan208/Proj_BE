import { ApiProperty } from '@nestjs/swagger';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomEntity } from 'src/rooms/room.entity';
import { FileEntity } from 'src/files/file.entity';

@Entity({
  name: 'room_expense',
})
export class RoomExpenseEntity extends EntityRelationalHelper {
  @ApiProperty({
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ApiProperty({
    type: () => RoomEntity,
    description: 'Room this expense belongs to',
  })
  @ManyToOne(() => RoomEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  room: RoomEntity;

  @ApiProperty({
    type: String,
    example: 'light bulb replacement',
  })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({
    type: String,
    example: 'light bulb replacement',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({
    type: Boolean,
    example: 'Is Asset Handed Over',
  })
  @Column({ type: 'boolean' })
  isAssetHandedOver: boolean;

  @ApiProperty({
    type: () => FileEntity,
    nullable: true,
  })
  @OneToOne(() => FileEntity, { nullable: true })
  @JoinColumn({ name: 'receiptId' })
  receipt: FileEntity | null;

  @ApiProperty({
    type: Number,
    example: 50000,
    description: 'Expense amount (numeric)',
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @ApiProperty({
    type: String,
    example: '2025-06-01',
    description: 'Date of the expense',
  })
  @Column({ type: 'date' })
  date: string;

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
