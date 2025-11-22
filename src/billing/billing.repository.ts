import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingEntity } from './billing.entity';

@Injectable()
export class BillingRepository {
  constructor(
    @InjectRepository(BillingEntity)
    private readonly repository: Repository<BillingEntity>,
  ) {}

  create(data: Partial<BillingEntity>): Promise<BillingEntity> {
    return this.repository.save(this.repository.create(data));
  }

  update(id: string, data: Partial<BillingEntity>): Promise<BillingEntity> {
    return this.repository.save(
      this.repository.create({
        id,
        ...data,
      }),
    );
  }

  findById(id: string): Promise<BillingEntity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  findByTenant(tenantId: string): Promise<BillingEntity[]> {
    return this.repository.find({
      where: { tenant: { id: tenantId } },
      order: { month: 'DESC' },
    });
  }

  findByRoom(roomId: string): Promise<BillingEntity[]> {
    return this.repository.find({
      where: { room: { id: roomId } },
      order: { month: 'DESC' },
    });
  }
}
