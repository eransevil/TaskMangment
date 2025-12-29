import { taskTypeRegistry } from '../core/task-type-registry';
import { ProcurementHandler } from './procurement-handler';
import { DevelopmentHandler } from './development-handler';

/**
 * Initialize and register all task type handlers.
 * To add a new task type, create a handler and register it here.
 */
export function initializeTaskTypes(): void {
  taskTypeRegistry.register(new ProcurementHandler());
  taskTypeRegistry.register(new DevelopmentHandler());
}

