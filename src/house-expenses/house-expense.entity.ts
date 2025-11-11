import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { HouseEntity } from 'src/houses/house.entity';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'house_expense' })
export class HouseExpenseEntity extends EntityRelationalHelper {
  @ApiProperty({ type: String })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => HouseEntity })
  @ManyToOne(() => HouseEntity, { eager: true })
  @Index()
  house: HouseEntity;

  @ApiProperty({ type: String })
  @Column({ type: String })
  name: string;

  @ApiProperty({ type: Number, example: 100000 })
  @Column({
    type: 'numeric',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  amount: number;

  @ApiProperty({ type: Date })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty()
  @DeleteDateColumn()
  @Expose({ groups: ['admin'] })
  deletedAt: Date;
}
