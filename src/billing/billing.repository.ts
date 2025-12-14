import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingEntity } from './billing.entity';
import { applyRelations } from 'src/utils/query-builder';

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

  async findById(
    id: string,
    userId: string,
    relations: string[] = [],
  ): Promise<BillingEntity | null> {
    const query = this.repository
      .createQueryBuilder('billing')
      .leftJoin('billing.room', 'room')
      .leftJoin('room.house', 'house')
      .leftJoin('house.owner', 'owner')
      .where('billing.id = :id', { id })
      .andWhere('owner.id = :userId', { userId });

    applyRelations(query, relations, {
      rootAlias: 'billing',
      allowedRelations: [
        'tenantContract',
        'tenantContract.tenant',
        'tenantContract.contract',
        'room',
        'room.house',
        'room.house.owner',
        'file',
        'proof',
      ],
      select: true,
    });

    return query.getOne();
  }

  async findByRoom(
    options: {
      roomId: string;
      userId: string; // REQUIRED
      from?: Date;
      to?: Date;
      status?: string;
      isCounting?: boolean;
    },
    relations: string[] = [],
  ): Promise<BillingEntity[] | number> {
    const { roomId, userId, from, to, status, isCounting = false } = options;

    const query = this.repository
      .createQueryBuilder('billing')
      .leftJoin('billing.room', 'room')
      .leftJoin('room.house', 'house')
      .leftJoin('house.owner', 'owner')
      .where('room.id = :roomId', { roomId })
      .andWhere('owner.id = :userId', { userId });

    // ---------- Optional filters ----------
    if (status) {
      query.andWhere('billing.status = :status', { status });
    }

    if (from) {
      query.andWhere('billing.from >= :from', { from });
    }

    if (to) {
      query.andWhere('billing.to <= :to', { to });
    }

    // ---------- Counting ----------
    if (isCounting) {
      return query.getCount();
    }

    applyRelations(query, relations, {
      rootAlias: 'billing',
      allowedRelations: [
        'tenantContract',
        'tenantContract.tenant',
        'tenantContract.contract',
        'room',
        'file',
      ],
      select: true, // change to false if you only need joins for filtering
    });

    // ---------- Data ----------
    return query.orderBy('billing.from', 'DESC').getMany();
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
