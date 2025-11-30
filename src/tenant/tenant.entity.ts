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
  @ManyToOne(() => RoomEntity)
  room: RoomEntity;

  @ApiProperty({
    type: String,
    example: 'Nguyen Van A',
  })
  @Index()
  @Column({ type: String })
  name: string;

  @ApiProperty({
    type: String,
    example: '0909090909',
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  phoneNumber?: string;

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
    type: String,
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  citizenId?: string;

  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  sex?: string;

  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  nationality?: string;

  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  home?: string;

  @ApiProperty({
    type: Date,
    nullable: true,
    required: false,
  })
  @Column({ type: Date, nullable: true })
  issueDate?: Date;

  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  issueLoc?: string;

  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  frontIdCardImagePath?: string;

  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  backIdCardImagePath?: string;

  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  tenantJob?: string;

  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  tenantWorkAt?: string;

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
