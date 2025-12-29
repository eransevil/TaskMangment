import { TaskTypeHandler } from '../core/task-type-registry';
import { TaskType } from '../entities/Task';

/**
 * Handler for Procurement tasks.
 * Implements task-specific validation and field requirements.
 */
export class ProcurementHandler implements TaskTypeHandler {
  readonly type = TaskType.PROCUREMENT;

  /**
   * Procurement has 3 open statuses:
   * 1 - Created
   * 2 - Supplier offers received
   * 3 - Purchase completed (final)
   */
  getMaxStatus(): number {
    return 3;
  }

  validateStatusRequirements(
    status: number,
    fields: Record<string, any>
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Common optional sanity checks
    if (fields.budget !== undefined) {
      if (typeof fields.budget !== 'number' || fields.budget < 0) {
        errors.push('budget must be a non-negative number');
      }
    }

    // Status-specific requirements
    if (status === 1) {
      // Created - no required data
      return { valid: errors.length === 0, errors };
    }

    if (status === 2) {
      // Supplier offers received - require 2 price-quote strings
      if (!fields.quote1 || typeof fields.quote1 !== 'string' || fields.quote1.trim() === '') {
        errors.push('quote1 is required and must be a non-empty string');
      }
      if (!fields.quote2 || typeof fields.quote2 !== 'string' || fields.quote2.trim() === '') {
        errors.push('quote2 is required and must be a non-empty string');
      }
      return { valid: errors.length === 0, errors };
    }

    if (status === 3) {
      // Purchase completed - require receipt string
      if (!fields.receipt || typeof fields.receipt !== 'string' || fields.receipt.trim() === '') {
        errors.push('receipt is required and must be a non-empty string');
      }
      return { valid: errors.length === 0, errors };
    }

    // Unknown status for this task type
    errors.push(`Unsupported status ${status} for procurement task`);
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
      // Normalize status 2 fields (quote1, quote2) while preserving all others
      if (fields.quote1) {
        transformed.quote1 = String(fields.quote1).trim();
      }
      if (fields.quote2) {
        transformed.quote2 = String(fields.quote2).trim();
      }
      return transformed;
    }

    if (status === 3) {
      // Normalize status 3 fields (receipt) while preserving all others
      if (fields.receipt) {
        transformed.receipt = String(fields.receipt).trim();
      }
      return transformed;
    }

    return transformed;
  }
}

