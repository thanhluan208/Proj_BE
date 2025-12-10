import { ApiProperty } from '@nestjs/swagger';
import { ContractEntity } from 'src/contracts/contract.entity';
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
  OneToMany,
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

  @OneToMany(() => ContractEntity, (contract) => contract.room)
  contracts: ContractEntity[];

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
