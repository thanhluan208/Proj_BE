import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RoleEntity } from './role.entity';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async create(data: Partial<RoleEntity>): Promise<RoleEntity> {
    const newEntity = this.roleRepository.create(data);
    return await this.roleRepository.save(newEntity);
  }

  async findById(id: number): Promise<RoleEntity | null> {
    return await this.roleRepository.findOne({
      where: { id },
    });
  }

  async findByIds(ids: number[]): Promise<RoleEntity[]> {
    return await this.roleRepository.find({
      where: { id: In(ids) },
    });
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    return await this.roleRepository.findOne({
      where: { name },
    });
  }

  async findAll(): Promise<RoleEntity[]> {
    return await this.roleRepository.find();
  }

  async update(
    id: number,
    payload: Partial<RoleEntity>,
  ): Promise<RoleEntity | null> {
    const entity = await this.roleRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    Object.assign(entity, payload);
    return await this.roleRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    await this.roleRepository.delete(id);
  }
}
