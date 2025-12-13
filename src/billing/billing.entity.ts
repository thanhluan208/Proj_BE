import { ApiProperty } from '@nestjs/swagger';
import { RoomEntity } from 'src/rooms/room.entity';
import { TenantEntity } from 'src/tenant/tenant.entity';
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
  UpdateDateColumn,
} from 'typeorm';
import { BillingStatusEnum } from './billing-status.enum';
import { TenantContractEntity } from 'src/tenant-contracts/tenant-contracts.entity';
import { FileEntity } from 'src/files/file.entity';

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
    type: () => TenantContractEntity,
  })
  @ManyToOne(() => TenantContractEntity)
  tenantContract: TenantContractEntity;

  @ApiProperty({
    type: () => RoomEntity,
  })
  @ManyToOne(() => RoomEntity)
  room: RoomEntity;

  @ApiProperty({
    type: () => FileEntity,
  })
  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'fileId' })
  file?: FileEntity;

  @ApiProperty({
    type: Date,
  })
  @Column({ type: 'date' })
  from: Date;

  @ApiProperty({
    type: Date,
  })
  @Column({ type: 'date' })
  to: Date;

  @ApiProperty({
    type: Number,
    example: 100,
    nullable: true,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  electricity_start_index: number;

  @ApiProperty({
    type: Number,
    example: 150,
    nullable: true,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  electricity_end_index: number;

  @ApiProperty({
    type: Number,
    example: 50,
    nullable: true,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  water_start_index: number;

  @ApiProperty({
    type: Number,
    example: 60,
    nullable: true,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  water_end_index: number;

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
