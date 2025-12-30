import { TaskTypeHandler } from '../core/task-type-registry';
import { TaskType } from '../entities/Task';

export const procurementHandler: TaskTypeHandler = {
  type: TaskType.PROCUREMENT,

  getMaxStatus: () => 3,

  validateStatusRequirements: (status: number, fields: Record<string, any>) => {
    const errors: string[] = [];

    if (fields.budget !== undefined) {
      if (typeof fields.budget !== 'number' || fields.budget < 0) {
        errors.push('budget must be a non-negative number');
      }
    }

    if (status === 1) {
      return { valid: errors.length === 0, errors };
    }

    if (status === 2) {
      if (!fields.quote1 || typeof fields.quote1 !== 'string' || fields.quote1.trim() === '') {
        errors.push('quote1 is required and must be a non-empty string');
      }
      if (!fields.quote2 || typeof fields.quote2 !== 'string' || fields.quote2.trim() === '') {
        errors.push('quote2 is required and must be a non-empty string');
      }
      return { valid: errors.length === 0, errors };
    }

    if (status === 3) {
      if (!fields.receipt || typeof fields.receipt !== 'string' || fields.receipt.trim() === '') {
        errors.push('receipt is required and must be a non-empty string');
      }
      return { valid: errors.length === 0, errors };
    }

    errors.push(`Unsupported status ${status} for procurement task`);
    return { valid: false, errors };
  },

  transformFields: (status: number, fields: Record<string, any>) => {
    const transformed: Record<string, any> = { ...fields };

    if (status === 2) {
      if (fields.quote1) transformed.quote1 = String(fields.quote1).trim();
      if (fields.quote2) transformed.quote2 = String(fields.quote2).trim();
    }

    if (status === 3) {
      if (fields.receipt) transformed.receipt = String(fields.receipt).trim();
    }

    return transformed;
  },
};