import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from 'src/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'file' })
export class FileEntity {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => UserEntity,
  })
  @ManyToOne(() => UserEntity)
  owner: UserEntity;

  @ApiProperty({
    type: String,
    example: 'https://example.com/path/to/file.jpg',
  })
  @Column()
  path: string;

  @ApiProperty({
    type: String,
    example: 'image/jpeg',
  })
  @Column({ nullable: true })
  mimeType: string;

  @ApiProperty({
    type: Number,
    example: 1024,
  })
  @Column({ nullable: true })
  size: number;

  @ApiProperty({
    type: String,
    example: 'original-filename.jpg',
  })
  @Column({ nullable: true })
  originalName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
