import {
  HttpStatus,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { UserService } from 'src/users/users.service';
import { TenantRepository } from './tenant.repository';
import { TenantEntity } from './tenant.entity';
import { UserEntity } from 'src/users/user.entity';

export class TenantHelper {
  private static readonly logger = new Logger(TenantHelper.name);

  /**
   * Validates that the user exists and returns the user entity
   * @throws UnprocessableEntityException if user not found
   */
  static async validateUser(
    userService: UserService,
    userJwtPayload: JwtPayloadType,
  ): Promise<UserEntity> {
    const user = await userService.findById(userJwtPayload.id);

    if (!user) {
      this.logger.error(`User not found with ID: ${userJwtPayload.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    return user;
  }

  /**
   * Finds a tenant with all necessary relations for ownership verification
   * @throws UnprocessableEntityException if tenant not found
   */
  static async findTenantWithRelations(
    tenantRepository: TenantRepository,
    tenantId: string,
    includeStatus: boolean = false,
  ): Promise<TenantEntity> {
    const relations = ['room', 'room.house', 'room.house.owner'];
    if (includeStatus) {
      relations.push('status');
    }

    const tenant = await tenantRepository.findById(tenantId, relations);

    if (!tenant) {
      this.logger.error(`Tenant not found with ID: ${tenantId}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          tenant: 'tenantNotFound',
        },
      });
    }

    return tenant;
  }

  /**
   * Verifies that the user owns the house containing the tenant
   * @throws UnprocessableEntityException if ownership verification fails
   */
  static verifyOwnership(
    tenant: TenantEntity,
    userId: string,
    tenantId: string,
  ): void {
    // Verify room exists
    const room = tenant.room;
    if (!room) {
      this.logger.error(`Room not found for tenant ${tenantId}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          room: 'roomNotFound',
        },
      });
    }

    // Verify house exists and user is the owner
    const house = room.house;
    if (!house || house.owner?.id !== userId) {
      this.logger.error(
        `User ${userId} is not the owner of the house containing tenant ${tenantId}`,
      );
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          house: 'notHouseOwner',
        },
      });
    }
  }

  /**
   * Validates user and tenant ownership in one call
   * Returns both user and tenant entities
   * @throws UnprocessableEntityException if validation fails
   */
  static async validateUserAndTenantOwnership(
    userService: UserService,
    tenantRepository: TenantRepository,
    userJwtPayload: JwtPayloadType,
    tenantId: string,
    includeStatus: boolean = false,
  ): Promise<{ user: UserEntity; tenant: TenantEntity }> {
    // Validate user exists
    const user = await this.validateUser(userService, userJwtPayload);

    // Find tenant with relations
    const tenant = await this.findTenantWithRelations(
      tenantRepository,
      tenantId,
      includeStatus,
    );

    // Verify ownership
    this.verifyOwnership(tenant, user.id, tenantId);

    return { user, tenant };
  }
}
