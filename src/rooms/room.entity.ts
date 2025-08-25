import { ApiProperty } from '@nestjs/swagger';
import { StatusEntity } from 'src/statuses/status.entity';
import { HouseEntity } from 'src/houses/house.entity';
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
import { UserEntity } from 'src/users/user.entity';
import { Expose } from 'class-transformer';

@Entity({
  name: 'room',
})
export class RoomEntity extends EntityRelationalHelper {
  @ApiProperty({
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => UserEntity,
  })
  @ManyToOne(() => UserEntity)
  @Expose({ groups: ['admin'] })
  owner: UserEntity;

  @ApiProperty({
    type: () => HouseEntity,
  })
  @ManyToOne(() => HouseEntity, {
    eager: true,
  })
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
  @Expose({ groups: ['admin'] })
  status?: StatusEntity;

  @ApiProperty({
    type: Number,
    example: 5000000,
    description: 'Room price in VND',
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @ApiProperty({
    type: Number,
    example: 200000,
    description: 'Electronic fee in VND',
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  electronic_fee: number;

  @ApiProperty({
    type: Number,
    example: 150000,
    description: 'Water fee in VND',
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  water_fee: number;

  @ApiProperty({
    type: Number,
    example: 300000,
    description: 'Living fee in VND',
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  living_fee: number;

  @ApiProperty({
    type: Number,
    example: 100000,
    description: 'Other fees in VND',
    nullable: true,
  })
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  other_fee?: number;

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
