import { ApiProperty } from '@nestjs/swagger';
import { FileEntity } from 'src/files/file.entity';
import { RoomEntity } from 'src/rooms/room.entity';
import { StatusEntity } from 'src/statuses/status.entity';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'contract',
})
@Unique(['file', 'room'])
export class ContractEntity extends EntityRelationalHelper {
  @ApiProperty({
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => RoomEntity,
  })
  @ManyToOne(() => RoomEntity)
  @JoinColumn({ name: 'roomId' })
  room: RoomEntity;

  @ApiProperty({
    type: () => FileEntity,
  })
  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'fileId' })
  file?: FileEntity;

  @ApiProperty({
    type: () => StatusEntity,
  })
  @ManyToOne(() => StatusEntity)
  @JoinColumn({ name: 'statusId' })
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
