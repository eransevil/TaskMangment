import { TaskType } from '../entities/Task';

export interface TaskTypeHandler {
  readonly type: TaskType;
  getMaxStatus(): number;
  validateStatusRequirements(
    status: number,
    fields: Record<string, any>
  ): {
    valid: boolean;
    errors: string[];
  };
  transformFields(
    status: number,
    fields: Record<string, any>
  ): Record<string, any>;
}

const handlers = new Map<TaskType, TaskTypeHandler>();

export function registerHandler(handler: TaskTypeHandler): void {
  if (handlers.has(handler.type)) {
    throw new Error(`Task type ${handler.type} is already registered`);
  }
  handlers.set(handler.type, handler);
}

export function getHandler(type: TaskType): TaskTypeHandler {
  const handler = handlers.get(type);
  if (!handler) {
    throw new Error(`No handler registered for task type: ${type}`);
  }
  return handler;
}

export function hasHandler(type: TaskType): boolean {
  return handlers.has(type);
}

export function getRegisteredTypes(): TaskType[] {
  return Array.from(handlers.keys());
}