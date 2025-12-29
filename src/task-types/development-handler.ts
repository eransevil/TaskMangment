import { TaskTypeHandler } from '../core/task-type-registry';
import { TaskType } from '../entities/Task';

/**
 * Handler for Development tasks.
 * Implements task-specific validation and field requirements.
 */
export class DevelopmentHandler implements TaskTypeHandler {
  readonly type = TaskType.DEVELOPMENT;

  /**
   * Development has 4 open statuses:
   * 1 - Created
   * 2 - Specification completed
   * 3 - Development completed
   * 4 - Distribution completed (final)
   */
  getMaxStatus(): number {
    return 4;
  }

  validateStatusRequirements(
    status: number,
    fields: Record<string, any>
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Status 1 - Created: no required data
    if (status === 1) {
      return { valid: true, errors };
    }

    if (status === 2) {
      // Specification completed - require specification text
      if (
        !fields.specification ||
        typeof fields.specification !== 'string' ||
        fields.specification.trim() === ''
      ) {
        errors.push('specification is required and must be a non-empty string');
      }
      return { valid: errors.length === 0, errors };
    }

    if (status === 3) {
      // Development completed - require branch name
      if (!fields.branch || typeof fields.branch !== 'string' || fields.branch.trim() === '') {
        errors.push('branch is required and must be a non-empty string');
      }
      return { valid: errors.length === 0, errors };
    }

    if (status === 4) {
      // Distribution completed - require version number/string
      if (!fields.version || (typeof fields.version !== 'string' && typeof fields.version !== 'number')) {
        errors.push('version is required and must be a string or number');
      }
      return { valid: errors.length === 0, errors };
    }

    errors.push(`Unsupported status ${status} for development task`);
    return { valid: false, errors };
  }

  transformFields(status: number, fields: Record<string, any>): Record<string, any> {
    // Preserve ALL existing fields to maintain data continuity and audit trail.
    // Only normalize/update fields relevant to the current status.
    // This ensures no data loss during task progression.
    const transformed: Record<string, any> = { ...fields };

    if (status === 1) {
      // Created - no required fields; preserve all existing fields
      return transformed;
    }

    if (status === 2) {
      // Normalize status 2 fields (specification) while preserving all others
      if (fields.specification) {
        transformed.specification = String(fields.specification).trim();
      }
      return transformed;
    }

    if (status === 3) {
      // Normalize status 3 fields (branch) while preserving all others
      if (fields.branch) {
        transformed.branch = String(fields.branch).trim();
      }
      return transformed;
    }

    if (status === 4) {
      // Normalize status 4 fields (version) while preserving all others
      if (fields.version !== undefined) {
        transformed.version = String(fields.version).trim();
      }
      return transformed;
    }

    return transformed;
  }
}

