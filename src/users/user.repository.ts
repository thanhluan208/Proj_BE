import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, In } from 'typeorm';
import { UserEntity } from './user.entity';
import { FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { IPaginationOptions } from 'src/utils/types/pagination-options';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const newEntity = this.userRepository.create(data);
    return await this.userRepository.save(newEntity);
  }

  async findById(id: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  async findByIds(ids: string[]): Promise<UserEntity[]> {
    return await this.userRepository.find({
      where: { id: In(ids) },
    });
  }

  async findByEmail(email: string | null): Promise<UserEntity | null> {
    if (!email) return null;

    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<UserEntity[]> {
    const where: FindOptionsWhere<UserEntity> = {};
    if (filterOptions?.roles?.length) {
      where.role = filterOptions.roles.map((role) => ({
        id: role.id,
      }));
    }

    return await this.userRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.orderBy]: sort.order,
        }),
        {},
      ),
    });
  }

  async update(
    id: string,
    payload: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    const entity = await this.userRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    Object.assign(entity, payload);
    return await this.userRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }
}
