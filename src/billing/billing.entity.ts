import { ApiProperty } from '@nestjs/swagger';
import { RoomEntity } from 'src/rooms/room.entity';
import { TenantEntity } from 'src/tenant/tenant.entity';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BillingStatusEnum } from './billing-status.enum';

@Entity({
  name: 'billing',
})
export class BillingEntity extends EntityRelationalHelper {
  @ApiProperty({
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => TenantEntity,
  })
  @ManyToOne(() => TenantEntity, {
    eager: true,
  })
  tenant: TenantEntity;

  @ApiProperty({
    type: () => RoomEntity,
  })
  @ManyToOne(() => RoomEntity, {
    eager: true,
  })
  room: RoomEntity;

  @ApiProperty({
    type: Date,
  })
  @Column({ type: 'date' })
  month: Date;

  @ApiProperty({
    type: Number,
    example: 100,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  electricity_start_index: number;

  @ApiProperty({
    type: Number,
    example: 150,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  electricity_end_index: number;

  @ApiProperty({
    type: Number,
    example: 50,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  water_start_index: number;

  @ApiProperty({
    type: Number,
    example: 60,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  water_end_index: number;

  @ApiProperty({
    type: Number,
    example: 150000,
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_electricity_cost: number;

  @ApiProperty({
    type: Number,
    example: 100000,
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_water_cost: number;

  @ApiProperty({
    type: Number,
    example: 100000,
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_living_cost: number;

  @ApiProperty({
    type: Number,
    example: 100000,
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_parking_cost: number;

  @ApiProperty({
    type: Number,
    example: 50000,
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_cleaning_cost: number;

  @ApiProperty({
    type: Number,
    example: 5000000,
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  base_rent: number;

  @ApiProperty({
    type: Number,
    example: 5500000,
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_amount: number;

  @ApiProperty({
    enum: BillingStatusEnum,
    example: BillingStatusEnum.PENDING_TENANT_PAYMENT,
  })
  @Column({
    type: 'enum',
    enum: BillingStatusEnum,
    default: BillingStatusEnum.PENDING_OWNER_REVIEW,
  })
  status: BillingStatusEnum;

  @ApiProperty({
    type: Date,
    nullable: true,
  })
  @Column({ type: 'date', nullable: true })
  payment_date?: Date;

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
