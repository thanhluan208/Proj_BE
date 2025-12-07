import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AuthProvidersEnum } from 'src/auth/auth-providers.enum';
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
import { RoleEntity } from 'src/roles/role.entity';
import { StatusEntity } from 'src/statuses/status.entity';

@Entity({
  name: 'user',
})
export class UserEntity extends EntityRelationalHelper {
  @ApiProperty({
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: String,
    example: 'john.doe@example.com',
  })
  @Column({ type: String, unique: true, nullable: true })
  email: string | null;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  password?: string;

  @ApiProperty({
    type: String,
    example: '0909090909',
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  phoneNumber?: string;

  @ApiProperty({
    type: String,
    example: '0909090909',
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  bankAccountName?: string;

  @ApiProperty({
    type: String,
    example: '0909090909',
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  bankAccountNumber?: string;

  @ApiProperty({
    type: String,
    example: '0909090909',
    nullable: true,
    required: false,
  })
  @Column({ type: String, nullable: true })
  bankName?: string;

  @ApiProperty({
    type: String,
    example: 'email',
  })
  @Expose({ groups: ['admin'] })
  @Column({ default: AuthProvidersEnum.email })
  provider: string;

  @ApiProperty({
    type: String,
    example: 'John',
  })
  @Index()
  @Column({ type: String, nullable: true })
  firstName: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
  })
  @Index()
  @Column({ type: String, nullable: true })
  lastName: string | null;

  @ApiProperty({
    type: () => RoleEntity,
  })
  @ManyToOne(() => RoleEntity, {
    eager: true,
  })
  @Expose({ groups: ['admin'] })
  role?: RoleEntity | null;

  @ApiProperty({
    type: () => StatusEntity,
  })
  @ManyToOne(() => StatusEntity, {
    eager: true,
  })
  @Expose({ groups: ['admin'] })
  status?: StatusEntity;

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
