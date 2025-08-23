import { SetMetadata, applyDecorators } from '@nestjs/common';
import { DynamicOwnershipOptions } from '../auth.type';
import { AUTH_CONSTANTS } from 'src/utils/constant';

// Attach dynamic ownership metadata
export function CheckOwnershipDynamic(options: DynamicOwnershipOptions) {
  return applyDecorators(
    SetMetadata(AUTH_CONSTANTS.ownershipMetadataKey, options),
  );
}
