import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './file.entity';

@Injectable()
export class FileRepository {
  constructor(
    @InjectRepository(File)
    private readonly repository: Repository<File>,
  ) {}

  async create(fileData: Partial<File>): Promise<File> {
    const file = this.repository.create(fileData);
    return this.repository.save(file);
  }

  async findById(id: string): Promise<File | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['owner'],
    });
  }

  async findByIds(ids: string[]): Promise<File[]> {
    return this.repository.find({
      where: { id: { $in: ids } as any },
      relations: ['owner'],
    });
  }

  async findByOwner(ownerId: string): Promise<File[]> {
    return this.repository.find({
      where: { owner: { id: ownerId } as any },
      relations: ['owner'],
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
