import { TaskType } from '../entities/Task';

/**
 * Contract that all task type handlers must implement.
 *
 * The handlers encapsulate task-type-specific rules such as:
 * - Maximum status value (final status)
 * - Per-status data requirements
 * - Per-status field normalization/transformation
 */
export interface TaskTypeHandler {
  /**
   * The task type this handler manages.
   */
  readonly type: TaskType;

  /**
   * Maximum status value for this task type.
   * Example:
   *  - Procurement: 3
   *  - Development: 4
   */
  getMaxStatus(): number;

  /**
   * Validate custom fields required for a specific status.
   * This is called before any status change is persisted.
   */
  validateStatusRequirements(
    status: number,
    fields: Record<string, any>
  ): {
    valid: boolean;
    errors: string[];
  };

  /**
   * Transform custom fields for a specific status before storage.
   * Can be used to normalize input and drop irrelevant fields.
   */
  transformFields(
    status: number,
    fields: Record<string, any>
  ): Record<string, any>;
}

/**
 * Registry for task type handlers.
 * New task types can be added by registering a handler without modifying existing code.
 */
class TaskTypeRegistry {
  private handlers: Map<TaskType, TaskTypeHandler> = new Map();

  /**
   * Register a task type handler
   */
  register(handler: TaskTypeHandler): void {
    if (this.handlers.has(handler.type)) {
      throw new Error(`Task type ${handler.type} is already registered`);
    }
    this.handlers.set(handler.type, handler);
  }

  /**
   * Get a handler for a specific task type
   */
  getHandler(type: TaskType): TaskTypeHandler {
    const handler = this.handlers.get(type);
    if (!handler) {
      throw new Error(`No handler registered for task type: ${type}`);
    }
    return handler;
  }

  /**
   * Check if a task type is registered
   */
  hasHandler(type: TaskType): boolean {
    return this.handlers.has(type);
  }

  /**
   * Get all registered task types
   */
  getRegisteredTypes(): TaskType[] {
    return Array.from(this.handlers.keys());
  }
}

// Export singleton instance
export const taskTypeRegistry = new TaskTypeRegistry();

