import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FileEntity } from './file.entity';

@Injectable()
export class FileRepository {
  constructor(
    @InjectRepository(FileEntity)
    private readonly repository: Repository<FileEntity>,
  ) {}

  async create(fileData: Partial<FileEntity>): Promise<FileEntity> {
    const file = this.repository.create(fileData);
    return this.repository.save(file);
  }

  async findById(id: string): Promise<FileEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['owner'],
    });
  }

  async findByIds(ids: string[]): Promise<FileEntity[]> {
    return this.repository.find({
      where: { id: In(ids) }, // Fixed: Use TypeORM's In operator instead of MongoDB syntax
      relations: ['owner'],
    });
  }

  async findByOwner(ownerId: string): Promise<FileEntity[]> {
    return this.repository.find({
      where: { owner: { id: ownerId } },
      relations: ['owner'],
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async update(
    id: string,
    updateData: Partial<FileEntity>,
  ): Promise<FileEntity | null> {
    await this.repository.update(id, updateData);
    return this.findById(id);
  }
}
