import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ContractEntity } from 'src/contracts/contract.entity';
import { HouseEntity } from 'src/houses/house.entity';
import { StatusEntity } from 'src/statuses/status.entity';
import { TenantEntity } from 'src/tenant/tenant.entity';
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
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'tenant_contract' })
export class TenantContractEntity extends EntityRelationalHelper {
  @ApiProperty({ type: String })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => ContractEntity })
  @ManyToOne(() => ContractEntity)
  @Index()
  contract: ContractEntity;

  @ApiProperty({ type: () => TenantEntity })
  @ManyToOne(() => TenantEntity)
  @Index()
  tenant: TenantEntity;

  @ApiProperty({
    type: () => StatusEntity,
  })
  @ManyToOne(() => StatusEntity)
  @JoinColumn({ name: 'statusId' })
  status: StatusEntity;

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
