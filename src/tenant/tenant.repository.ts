import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { TenantEntity } from './tenant.entity';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  async create(data: Partial<TenantEntity>): Promise<TenantEntity> {
    const newEntity = this.tenantRepository.create(data);
    return await this.tenantRepository.save(newEntity);
  }

  async findById(id: string): Promise<TenantEntity | null> {
    return await this.tenantRepository.findOne({
      where: { id },
    });
  }

  async findByIds(ids: string[]): Promise<TenantEntity[]> {
    return await this.tenantRepository.find({
      where: { id: In(ids) },
    });
  }

  async findByRoom(
    room_id: string,
    options?: {
      skip?: number;
      take?: number;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    },
  ): Promise<TenantEntity[]> {
    const query = this.tenantRepository.createQueryBuilder('tenant');

    query
      .leftJoin('tenant.room', 'room')
      .leftJoinAndSelect('tenant.status', 'status')
      .where('room.id = :roomId', { roomId: room_id })
      .andWhere('tenant.deletedAt IS NULL');

    if (options?.status) {
      query.andWhere('LOWER(status.name) = LOWER(:status)', {
        status: options.status,
      });
    }

    if (options?.dateFrom) {
      query.andWhere('tenant.createdAt >= :dateFrom', {
        dateFrom: options.dateFrom,
      });
    }

    if (options?.dateTo) {
      query.andWhere('tenant.createdAt <= :dateTo', {
        dateTo: options.dateTo,
      });
    }

    if (options?.search) {
      query.andWhere('LOWER(tenant.name) LIKE LOWER(:search)', {
        search: `%${options.search}%`,
      });
    }

    if (options?.skip) {
      query.skip(options.skip);
    }

    if (options?.take) {
      query.take(options.take);
    }

    query.orderBy('tenant.createdAt', 'DESC');

    return await query.getMany();
  }

  async countByRoom(
    room_id: string,
    options?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    },
  ): Promise<number> {
    const query = this.tenantRepository.createQueryBuilder('tenant');

    query
      .leftJoin('tenant.room', 'room')
      .leftJoin('tenant.status', 'status')
      .where('room.id = :roomId', { roomId: room_id })
      .andWhere('tenant.deletedAt IS NULL');

    if (options?.status) {
      query.andWhere('LOWER(status.name) = LOWER(:status)', {
        status: options.status,
      });
    }

    if (options?.dateFrom) {
      query.andWhere('tenant.createdAt >= :dateFrom', {
        dateFrom: options.dateFrom,
      });
    }

    if (options?.dateTo) {
      query.andWhere('tenant.createdAt <= :dateTo', {
        dateTo: options.dateTo,
      });
    }

    if (options?.search) {
      query.andWhere('LOWER(tenant.name) LIKE LOWER(:search)', {
        search: `%${options.search}%`,
      });
    }

    return await query.getCount();
  }

  async update(
    id: string,
    payload: Partial<TenantEntity>,
  ): Promise<TenantEntity | null> {
    const entity = await this.tenantRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    Object.assign(entity, payload);
    return await this.tenantRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.tenantRepository.softDelete(id);
  }

  async save(tenant: TenantEntity): Promise<TenantEntity> {
    return await this.tenantRepository.save(tenant);
  }
}
