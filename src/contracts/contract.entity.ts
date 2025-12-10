import { ApiProperty } from '@nestjs/swagger';
import { FileEntity } from 'src/files/file.entity';
import { RoomEntity } from 'src/rooms/room.entity';
import { StatusEntity } from 'src/statuses/status.entity';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'contract',
})
@Unique(['file', 'room'])
export class ContractEntity extends EntityRelationalHelper {
  @ApiProperty({
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => RoomEntity,
  })
  @ManyToOne(() => RoomEntity)
  @JoinColumn({ name: 'roomId' })
  room: RoomEntity;

  @ApiProperty({
    type: () => FileEntity,
  })
  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'fileId' })
  file?: FileEntity;

  @ApiProperty({
    type: () => StatusEntity,
  })
  @ManyToOne(() => StatusEntity)
  @JoinColumn({ name: 'statusId' })
  status?: StatusEntity;

  @ApiProperty({
    type: Date,
  })
  @Column({ type: Date })
  createdDate: Date;

  @ApiProperty({
    type: Date,
  })
  @Column({ type: Date })
  startDate: Date;

  @ApiProperty({
    type: Date,
  })
  @Column({ type: Date })
  endDate: Date;

  @ApiProperty({
    type: Number,
    example: 5000000,
    description: 'Base rent in VND',
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  base_rent: number;

  @ApiProperty({
    type: Number,
    example: 100000,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  internet_fee: number;

  @ApiProperty({
    type: Number,
    example: 3000,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price_per_electricity_unit: number;

  @ApiProperty({
    type: Number,
    example: 10000,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price_per_water_unit: number;

  @ApiProperty({
    type: Number,
    example: 50000,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fixed_water_fee: number;

  @ApiProperty({
    type: Number,
    example: 50000,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fixed_electricity_fee: number;

  @ApiProperty({
    type: Number,
    example: 100000,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  living_fee: number;

  @ApiProperty({
    type: Number,
    example: 100000,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  parking_fee: number;

  @ApiProperty({
    type: Number,
    example: 50000,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cleaning_fee: number;

  @ApiProperty({
    type: String,
    example: 'My house',
  })
  @Column({ type: String, nullable: true })
  overRentalFee?: string;

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
