import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { ContractEntity } from './contract.entity';
import { StatusEnum } from 'src/statuses/statuses.enum';

@Injectable()
export class ContractsRepository {
  constructor(
    @InjectRepository(ContractEntity)
    private readonly contractRepository: Repository<ContractEntity>,
  ) {}

  async create(contractData: Partial<ContractEntity>): Promise<ContractEntity> {
    const contract = this.contractRepository.create(contractData);
    return await this.contractRepository.save(contract);
  }

  async findById(id: string): Promise<ContractEntity | null> {
    return await this.contractRepository.findOne({
      where: { id },
      relations: ['owner', 'tenant', 'room', 'file', 'status'],
    });
  }

  async findAll(
    options?: FindManyOptions<ContractEntity>,
  ): Promise<ContractEntity[]> {
    const defaultOptions: FindManyOptions<ContractEntity> = {
      relations: ['owner', 'tenant', 'room', 'file', 'status'],
      order: { createdAt: 'DESC' },
      ...options,
    };
    return await this.contractRepository.find(defaultOptions);
  }

  async findByRoom(
    roomId: string,
    relations?: string[],
  ): Promise<ContractEntity | null> {
    return await this.contractRepository.findOne({
      where: { room: { id: roomId }, status: { id: StatusEnum.active } },
      relations: relations,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    where: FindOptionsWhere<ContractEntity>,
  ): Promise<ContractEntity | null> {
    return await this.contractRepository.findOne({
      where,
      relations: ['owner', 'tenant', 'room', 'file', 'status'],
    });
  }

  async update(
    id: string,
    updateData: Partial<ContractEntity>,
  ): Promise<ContractEntity | null> {
    await this.contractRepository.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.contractRepository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  async restore(id: string): Promise<boolean> {
    const result = await this.contractRepository.restore(id);
    return (result.affected ?? 0) > 0;
  }

  async count(where?: FindOptionsWhere<ContractEntity>): Promise<number> {
    return await this.contractRepository.count({ where });
  }

  async exists(where: FindOptionsWhere<ContractEntity>): Promise<boolean> {
    const count = await this.contractRepository.count({ where });
    return count > 0;
  }
}
