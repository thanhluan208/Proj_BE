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

@Entity({
  name: 'user_project',
})
export class UserProjectEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @ManyToOne(() => ProjectEntity)
  project: ProjectEntity;

  @ManyToOne(() => UserEntity, {
    nullable: true,
  })
  addedBy?: UserEntity | null;

  @Column({ type: String, nullable: true })
  role?: string | null;

  @Column({ type: Date })
  joinedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
