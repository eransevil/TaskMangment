import { TaskLifecycleState } from '../entities/Task';

export type Direction = 'forward' | 'backward';

export interface StatusChangeResult {
  success: boolean;
  nextStatus?: number;
  error?: string;
}

/**
 * Core workflow engine - validates and executes status transitions.
 *
 * Rules:
 * 1. A task is either Open or Closed. Closed tasks are immutable.
 * 2. Status is tracked by ascending integers: 1, 2, 3, ...
 * 3. Forward moves must be sequential (no skipping).
 * 4. Backward moves are always allowed (while task is open).
 * 5. A task may be closed only at its final status.
 */
export class WorkflowEngine {
  /**
   * Change status forward or backward by exactly one step.
   *
   * @param currentStatus Current integer status (1..maxStatus)
   * @param maxStatus     Maximum status for the task type
   * @param direction     'forward' or 'backward'
   * @param lifecycleState  OPEN or CLOSED
   */
  static changeStatus(
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

    // backward
    const next = currentStatus - 1;
    if (next < 1) {
      return {
        success: false,
        error: 'Cannot move backward before status 1',
      };
    }

    return { success: true, nextStatus: next };
  }

  /**
   * Close a task from its current status.
   *
   * @param currentStatus   Current integer status
   * @param maxStatus       Maximum status for the task type
   * @param lifecycleState  OPEN or CLOSED
   */
  static close(
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
}


