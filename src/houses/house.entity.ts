import { ApiProperty } from '@nestjs/swagger';
import { StatusEntity } from 'src/statuses/status.entity';
import { UserEntity } from 'src/users/user.entity';
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
  name: 'house',
})
export class HouseEntity extends EntityRelationalHelper {
  @ApiProperty({
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => UserEntity,
  })
  @ManyToOne(() => UserEntity, {
    eager: true,
  })
  owner: UserEntity;

  @ApiProperty({
    type: String,
    example: 'My house',
  })
  @Index()
  @Column({ type: String })
  name: string;

  @ApiProperty({
    type: String,
    example: `My house's description`,
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
