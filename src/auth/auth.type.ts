import { Type } from '@nestjs/common';

// Options for dynamic ownership
export type DynamicOwnershipOptions = {
  entity: Type<any>;

  resourceIdParam?: string;
  resourceIdBodyPath?: string;

  ownerField: string;
};
