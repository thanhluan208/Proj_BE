import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './user.repository';
import { AuthProvidersEnum } from 'src/auth/auth-providers.enum';
import { RoleEnum } from 'src/roles/roles.enum';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private readonly usersRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    this.logger.log(`Create user called for email: ${createUserDto.email}`);
    const existing = await this.usersRepository.findByEmail(
      createUserDto.email,
    );
    if (existing) {
      this.logger.warn(
        `Attempt to create user with existing email: ${createUserDto.email}`,
      );
      throw new BadRequestException('Email already exists');
    }

    let role: { id: string } | undefined = undefined;

    if (createUserDto.role?.id !== undefined) {
      const roleObject = Object.values(RoleEnum)
        .map(String)
        .includes(String(createUserDto.role.id));
      if (!roleObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            role: 'roleNotExists',
          },
        });
      }

      role = {
        id: String(createUserDto.role.id),
      };
    }

    let status: { id: string } | undefined = undefined;

    if (createUserDto.status?.id !== undefined) {
      const statusObject = Object.values(StatusEnum)
        .map(String)
        .includes(String(createUserDto.status.id));
      if (!statusObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            status: 'statusNotExists',
          },
        });
      }

      status = {
        id: String(createUserDto.status.id),
      };
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = await this.usersRepository.create({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      provider: createUserDto.provider ?? AuthProvidersEnum.email,
      role: role as any,
      status: status as any,
      email: createUserDto.email,
      password: hashedPassword,
    });
    this.logger.log(`User entity created for email: ${createUserDto.email}`);

    return user;
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findById(id);
  }

  findByIds(ids: string[]): Promise<UserEntity[]> {
    return this.usersRepository.findByIds(ids);
  }

  findByEmail(email: string | null): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity | null> {
    // Do not remove comment below.
    // <updating-property />

    let password: string | undefined = undefined;

    if (updateUserDto.password) {
      const userObject = await this.usersRepository.findById(id);

      if (userObject && userObject?.password !== updateUserDto.password) {
        const salt = await bcrypt.genSalt();
        password = await bcrypt.hash(updateUserDto.password, salt);
      }
    }

    let email: string | null | undefined = undefined;

    if (updateUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );

      if (userObject && userObject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailAlreadyExists',
          },
        });
      }

      email = updateUserDto.email;
    } else if (updateUserDto.email === null) {
      email = null;
    }

    let role: { id: string } | undefined = undefined;

    if (updateUserDto.role?.id) {
      const roleObject = Object.values(RoleEnum)
        .map(String)
        .includes(String(updateUserDto.role.id));
      if (!roleObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            role: 'roleNotExists',
          },
        });
      }

      role = {
        id: String(updateUserDto.role.id),
      };
    }

    let status: { id: string } | undefined = undefined;

    if (updateUserDto.status?.id) {
      const statusObject = Object.values(StatusEnum)
        .map(String)
        .includes(String(updateUserDto.status.id));
      if (!statusObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            status: 'statusNotExists',
          },
        });
      }

      status = {
        id: String(updateUserDto.status.id),
      };
    }

    return this.usersRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      email,
      password,
      role: role as any,
      status: status as any,
      provider: updateUserDto.provider,
    });
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.remove(id);
  }
}
