import { TaskTypeHandler } from '../core/task-type-registry';
import { TaskType } from '../entities/Task';

export const developmentHandler: TaskTypeHandler = {
  type: TaskType.DEVELOPMENT,

  getMaxStatus: () => 4,

  validateStatusRequirements: (status: number, fields: Record<string, any>) => {
    const errors: string[] = [];

    if (status === 1) {
      return { valid: true, errors };
    }

    if (status === 2) {
      if (!fields.specification || typeof fields.specification !== 'string' || fields.specification.trim() === '') {
        errors.push('specification is required and must be a non-empty string');
      }
      return { valid: errors.length === 0, errors };
    }

    if (status === 3) {
      if (!fields.branch || typeof fields.branch !== 'string' || fields.branch.trim() === '') {
        errors.push('branch is required and must be a non-empty string');
      }
      return { valid: errors.length === 0, errors };
    }

    if (status === 4) {
      if (!fields.version || (typeof fields.version !== 'string' && typeof fields.version !== 'number')) {
        errors.push('version is required and must be a string or number');
      }
      return { valid: errors.length === 0, errors };
    }

    errors.push(`Unsupported status ${status} for development task`);
    return { valid: false, errors };
  },

  transformFields: (status: number, fields: Record<string, any>) => {
    const transformed: Record<string, any> = { ...fields };

    if (status === 2 && fields.specification) {
      transformed.specification = String(fields.specification).trim();
    }

    if (status === 3 && fields.branch) {
      transformed.branch = String(fields.branch).trim();
    }

    if (status === 4 && fields.version !== undefined) {
      transformed.version = String(fields.version).trim();
    }

    return transformed;
  },
};