import { ApiBodyOptions } from '@nestjs/swagger';

export const CreateApiBody: ApiBodyOptions = {
  schema: {
    type: 'object',
    required: ['roomId', 'expenses'],
    properties: {
      roomId: {
        type: 'string',
        format: 'uuid',
        example: 'aab67484-6fdc-4573-942c-1a1f266cb1c8',
        description: 'Room ID',
      },
      expenses: {
        type: 'array',
        description: 'Array of expenses in JSON format',
        items: {
          type: 'object',
          required: ['name', 'amount', 'date'],
          properties: {
            name: { type: 'string', example: 'Light bulb replacement' },
            amount: { type: 'string', example: '50000' },
            notes: { type: 'string', example: 'Light bulb replacement' },
            date: { type: 'string', format: 'date', example: '2025-06-01' },
          },
        },
      },
      receipts: {
        type: 'array',
        description:
          'Receipt files for each expense (in same order as expenses array)',
        items: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  },
};
