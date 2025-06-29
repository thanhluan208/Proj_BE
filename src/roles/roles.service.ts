import { Injectable, Logger } from '@nestjs/common';
import { RoleRepository } from './role.repository';
import { RoleEntity } from './role.entity';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly roleRepository: RoleRepository) {}

  async findById(id: number): Promise<RoleEntity | null> {
    this.logger.log(`Finding role with ID: ${id}`);
    return await this.roleRepository.findById(id);
  }

  async findByIds(ids: number[]): Promise<RoleEntity[]> {
    this.logger.log(`Finding roles with IDs: ${ids.join(', ')}`);
    return await this.roleRepository.findByIds(ids);
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    this.logger.log(`Finding role with name: ${name}`);
    return await this.roleRepository.findByName(name);
  }

  async findAll(): Promise<RoleEntity[]> {
    this.logger.log('Finding all roles');
    return await this.roleRepository.findAll();
  }

  async create(data: Partial<RoleEntity>): Promise<RoleEntity> {
    this.logger.log(`Creating role with name: ${data.name}`);
    return await this.roleRepository.create(data);
  }

  async update(
    id: number,
    payload: Partial<RoleEntity>,
  ): Promise<RoleEntity | null> {
    this.logger.log(`Updating role with ID: ${id}`);
    return await this.roleRepository.update(id, payload);
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Removing role with ID: ${id}`);
    await this.roleRepository.remove(id);
  }
}
