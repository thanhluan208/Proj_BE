import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import { UserEntity } from 'src/users/infrastructure/persistence/relational/entities/user.entity';

@Entity({
  name: 'session',
})
export class SessionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, {
    eager: true,
  })
  @Index()
  user: UserEntity;

  @Column()
  hash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
