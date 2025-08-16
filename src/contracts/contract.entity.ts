import { ApiProperty } from '@nestjs/swagger';
import { FileEntity } from 'src/files/file.entity';
import { RoomEntity } from 'src/rooms/room.entity';
import { StatusEntity } from 'src/statuses/status.entity';
import { TenantEntity } from 'src/tenant/tenant.entity';
import { UserEntity } from 'src/users/user.entity';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity({
  name: 'contract',
})
@Unique(['tenant', 'file', 'room', 'owner'])
export class ContractEntity extends EntityRelationalHelper {
  @ApiProperty({
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => UserEntity,
  })
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity;

  @ApiProperty({
    type: () => TenantEntity,
  })
  @OneToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

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
