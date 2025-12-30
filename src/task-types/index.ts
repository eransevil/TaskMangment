import { registerHandler } from '../core/task-type-registry';
import { procurementHandler } from './procurement-handler';
import { developmentHandler } from './development-handler';

export function initializeTaskTypes(): void {
  registerHandler(procurementHandler);
  registerHandler(developmentHandler);
}