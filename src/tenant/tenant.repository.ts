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
    options?: { skip?: number; take?: number },
  ): Promise<TenantEntity[]> {
    return await this.tenantRepository.find({
      where: {
        room: { id: room_id },
        deletedAt: IsNull(),
      },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async countByRoom(room_id: string): Promise<number> {
    return await this.tenantRepository.count({
      where: {
        room: { id: room_id },
        deletedAt: IsNull(),
      },
    });
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
