import { UserEntity } from 'src/users/infrastructure/persistence/relational/entities/user.entity';
import { ProjectEntity } from 'src/projects/infrastructure/persistence/relational/entities/project.entity';
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
import { StatusEntity } from 'src/statuses/infrastructure/persistence/relational/entities/status.entity';

@Entity({
  name: 'user-project',
})
export class UserProjectEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @ManyToOne(() => ProjectEntity)
  project: ProjectEntity;

  @ManyToOne(() => StatusEntity)
  status: StatusEntity;

  @ManyToOne(() => UserEntity, {
    nullable: true,
  })
  addedBy?: UserEntity;

  @Column({ type: String, nullable: true })
  role?: string;

  @Column({ type: Date })
  joinedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
