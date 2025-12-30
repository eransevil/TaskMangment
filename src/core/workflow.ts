import { TaskLifecycleState } from '../entities/Task';

export type Direction = 'forward' | 'backward';

export interface StatusChangeResult {
  success: boolean;
  nextStatus?: number;
  error?: string;
}

export function changeStatus(
  currentStatus: number,
  maxStatus: number,
  direction: Direction,
  lifecycleState: TaskLifecycleState
): StatusChangeResult {
  if (lifecycleState === TaskLifecycleState.CLOSED) {
    return {
      success: false,
      error: 'Closed tasks are immutable',
    };
  }

  if (direction === 'forward') {
    const next = currentStatus + 1;
    if (next > maxStatus) {
      return {
        success: false,
        error: 'Cannot move forward beyond the final status',
      };
    }
    return { success: true, nextStatus: next };
  }

  const next = currentStatus - 1;
  if (next < 1) {
    return {
      success: false,
      error: 'Cannot move backward before status 1',
    };
  }

  return { success: true, nextStatus: next };
}

export function closeTask(
  currentStatus: number,
  maxStatus: number,
  lifecycleState: TaskLifecycleState
): StatusChangeResult {
  if (lifecycleState === TaskLifecycleState.CLOSED) {
    return {
      success: false,
      error: 'Task is already closed',
    };
  }

  if (currentStatus !== maxStatus) {
    return {
      success: false,
      error: 'Tasks can only be closed from their final status',
    };
  }

  return { success: true };
}