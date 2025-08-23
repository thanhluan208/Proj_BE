import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';
import { Repository } from 'typeorm';
import { DynamicOwnershipOptions } from '../auth.type';
import { AUTH_CONSTANTS } from 'src/utils/constant';
import { getByPath } from 'src/utils/helper';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // Get metadata from decorator
    const options = this.reflector.get<DynamicOwnershipOptions | undefined>(
      AUTH_CONSTANTS.ownershipMetadataKey,
      ctx.getHandler(),
    );

    // No decorator → skip
    if (!options) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req?.user;

    // Ensure authenticated

    if (!user?.id) throw new UnauthorizedException();

    // Extract target id
    const resourceId =
      (options.resourceIdParam && req.params?.[options.resourceIdParam]) ||
      (options.resourceIdBodyPath &&
        getByPath(req.body, options.resourceIdBodyPath));

    if (!resourceId) throw new ForbiddenException('Target id missing');

    // Resolve repository dynamically
    const repo: Repository<any> = this.moduleRef.get(
      options.entity.name + 'Repository',
      {
        strict: false,
      },
    );

    if (!repo) {
      throw new Error(`Repository for ${options.entity.name} not found`);
    }

    // Load row
    const entity = await repo.findOne({
      where: { id: resourceId },
      select: ['id', options.ownerField],
    });

    if (!entity) throw new ForbiddenException('Resource not found');

    // Check ownership
    if (String(entity[options.ownerField]?.id) !== String(user.id)) {
      throw new ForbiddenException('Not the owner');
    }

    return true;
  }
}
