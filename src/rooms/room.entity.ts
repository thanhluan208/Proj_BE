import { ApiProperty } from '@nestjs/swagger';
import { HouseEntity } from 'src/houses/house.entity';
import { StatusEntity } from 'src/statuses/status.entity';
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
  name: 'room',
})
export class RoomEntity extends EntityRelationalHelper {
  @ApiProperty({
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ApiProperty({
    type: () => HouseEntity,
  })
  @ManyToOne(() => HouseEntity)
  house: HouseEntity;

  @ApiProperty({
    type: String,
    example: '101',
  })
  @Index()
  @Column({ type: String })
  name: string;

  @ApiProperty({
    type: String,
    example: `101 description`,
    nullable: true,
  })
  @Column({ type: String, nullable: true })
  description?: string;

  @ApiProperty({
    type: () => StatusEntity,
  })
  @ManyToOne(() => StatusEntity, {
    eager: true,
  })
  status?: StatusEntity;

  @ApiProperty({
    type: Number,
    example: 20.5,
    description: 'Room size in square meters',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  size_sq_m: number;

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
    type: Date,
    example: '2024-01-01',
    nullable: true,
  })
  @Column({ type: 'date', nullable: true })
  paymentDate?: Date;

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
