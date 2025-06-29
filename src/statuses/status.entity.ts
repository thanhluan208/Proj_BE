import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'status',
})
export class StatusEntity extends EntityRelationalHelper {
  @Allow()
  @ApiProperty({
    type: Number,
  })
  @PrimaryColumn()
  id: number;

  @Allow()
  @ApiProperty({
    type: String,
    example: 'active',
  })
  @Column()
  name?: string;
}
