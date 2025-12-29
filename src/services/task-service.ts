import { Repository } from 'typeorm';
import {
  Task,
  TaskLifecycleState,
  TaskState,
  TaskType,
} from '../entities/Task';
import { User } from '../entities/User';
import { Direction, WorkflowEngine } from '../core/workflow';
import { taskTypeRegistry } from '../core/task-type-registry';

export interface CreateTaskDto {
  title: string;
  description?: string;
  type: TaskType;
  assigneeId: string;
  customFields?: Record<string, any>;
}

export interface ChangeStatusDto {
  direction: Direction;
  nextAssigneeId?: string;
  customFields?: Record<string, any>;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  customFields?: Record<string, any>;
}

export class TaskService {
  constructor(
    private taskRepository: Repository<Task>,
    private userRepository: Repository<User>
  ) {}

  /**
   * Create a new task with validation
   */
  async createTask(dto: CreateTaskDto): Promise<Task> {
    // Validate assignee exists
    const assignee = await this.userRepository.findOne({
      where: { id: dto.assigneeId },
    });

    if (!assignee) {
      throw new Error(`User with id ${dto.assigneeId} not found`);
    }

    // Get task type handler
    const handler = taskTypeRegistry.getHandler(dto.type);
    const initialStatus = 1;

    // Validate and transform custom fields for initial status
    const customFields = dto.customFields || {};
    const validation = handler.validateStatusRequirements(initialStatus, customFields);

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const transformedFields = handler.transformFields(initialStatus, customFields);

    // Create task - start as OPEN, status 1
    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description || null,
      type: dto.type,
      status: initialStatus,
      lifecycleState: TaskLifecycleState.OPEN,
      // Keep legacy state in sync for the current UI
      state: this.mapStatusToState(initialStatus, TaskLifecycleState.OPEN, dto.type),
      assigneeId: dto.assigneeId,
      customFields: transformedFields,
    });

    const savedTask = await this.taskRepository.save(task);
    
    // Reload with assignee relation
    const taskWithAssignee = await this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['assignee'],
    });

    if (!taskWithAssignee) {
      throw new Error('Failed to retrieve created task');
    }

    return taskWithAssignee;
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    return await this.taskRepository.findOne({
      where: { id },
      relations: ['assignee'],
    });
  }

  /**
   * Get all tasks for a user
   */
  async getTasksByUser(userId: string): Promise<Task[]> {
    return await this.taskRepository.find({
      where: { assigneeId: userId },
      relations: ['assignee'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    return await this.taskRepository.find({
      relations: ['assignee'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update task (only title, description, and custom fields)
   */
  async updateTask(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.getTaskById(id);

    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }

    if (task.lifecycleState === TaskLifecycleState.CLOSED) {
      throw new Error('Closed tasks are immutable');
    }

    // If custom fields are being updated, validate them for the current status
    if (dto.customFields !== undefined) {
      const handler = taskTypeRegistry.getHandler(task.type);
      const validation = handler.validateStatusRequirements(
        task.status,
        dto.customFields
      );

      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const transformedFields = handler.transformFields(
        task.status,
        dto.customFields
      );
      task.customFields = transformedFields;
    }

    if (dto.title !== undefined) {
      task.title = dto.title;
    }

    if (dto.description !== undefined) {
      task.description = dto.description;
    }

    const savedTask = await this.taskRepository.save(task);
    
    // Reload with assignee relation
    const taskWithAssignee = await this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['assignee'],
    });

    if (!taskWithAssignee) {
      throw new Error('Failed to retrieve updated task');
    }

    return taskWithAssignee;
  }

  /**
   * Change task status forward or backward (core workflow rule).
   * This enforces:
   * - Sequential integer statuses (no skipping)
   * - Closed tasks are immutable
   * - Per-status data requirements
   * - Recording the next assigned user (if provided)
   */
  async changeStatus(id: string, dto: ChangeStatusDto): Promise<Task> {
    const task = await this.getTaskById(id);

    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }

    if (task.lifecycleState === TaskLifecycleState.CLOSED) {
      throw new Error('Closed tasks are immutable');
    }

    const handler = taskTypeRegistry.getHandler(task.type);
    const maxStatus = handler.getMaxStatus();

    const result = WorkflowEngine.changeStatus(
      task.status,
      maxStatus,
      dto.direction,
      task.lifecycleState
    );

    if (!result.success || result.nextStatus === undefined) {
      throw new Error(result.error || 'Cannot change task status');
    }

    const nextStatus = result.nextStatus;

    // Merge existing fields with provided ones so that required data is not lost
    const existingFields = task.customFields || {};
    const providedFields = dto.customFields || {};
    const mergedFields = { ...existingFields, ...providedFields };

    // Validate type-specific requirements for the next status ONLY on forward moves.
    // Backward moves are always allowed by the core rules and should not force
    // the user to re-satisfy forward-oriented data requirements.
    if (dto.direction === 'forward') {
      const validation = handler.validateStatusRequirements(nextStatus, mergedFields);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Resolve next assignee:
    // - if provided, validate and assign
    // - otherwise keep the current assignee (still satisfies "record next user")
    let nextAssigneeId = task.assigneeId;
    if (dto.nextAssigneeId && dto.nextAssigneeId !== task.assigneeId) {
      const nextAssignee = await this.userRepository.findOne({
        where: { id: dto.nextAssigneeId },
      });
      if (!nextAssignee) {
        throw new Error(`User with id ${dto.nextAssigneeId} not found`);
      }
      nextAssigneeId = dto.nextAssigneeId;
    }

    // Apply transformations and persist
    task.status = nextStatus;
    task.lifecycleState = TaskLifecycleState.OPEN;
    task.state = this.mapStatusToState(nextStatus, TaskLifecycleState.OPEN, task.type);
    task.assigneeId = nextAssigneeId;

    // On forward moves, apply transformation for the target status.
    // On backward moves, keep existing fields (mergedFields) without enforcing
    // new requirements; this keeps history while honoring "backward moves always allowed".
    if (dto.direction === 'forward') {
      task.customFields = handler.transformFields(nextStatus, mergedFields);
    } else {
      task.customFields = existingFields;
    }

    const savedTask = await this.taskRepository.save(task);

    // Reload with assignee relation
    const taskWithAssignee = await this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['assignee'],
    });

    if (!taskWithAssignee) {
      throw new Error('Failed to retrieve updated task');
    }

    return taskWithAssignee;
  }

  /**
   * Convenience wrappers for the existing advance / reverse endpoints.
   * They delegate to changeStatus with the appropriate direction.
   */
  async advanceTask(id: string, dto: Omit<ChangeStatusDto, 'direction'> = {}): Promise<Task> {
    return this.changeStatus(id, { ...dto, direction: 'forward' });
  }

  async reverseTask(id: string, dto: Omit<ChangeStatusDto, 'direction'> = {}): Promise<Task> {
    return this.changeStatus(id, { ...dto, direction: 'backward' });
  }

  /**
   * Close task (core workflow rule)
   * - Only allowed from final status
   * - Closed tasks become immutable
   */
  async closeTask(id: string): Promise<Task> {
    const task = await this.getTaskById(id);

    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }

    const handler = taskTypeRegistry.getHandler(task.type);
    const maxStatus = handler.getMaxStatus();

    const result = WorkflowEngine.close(
      task.status,
      maxStatus,
      task.lifecycleState
    );

    if (!result.success) {
      throw new Error(result.error || 'Cannot close task');
    }

    // As a safety net, revalidate that final status requirements are satisfied
    const fields = task.customFields || {};
    const validation = handler.validateStatusRequirements(task.status, fields);
    if (!validation.valid) {
      throw new Error(
        `Cannot close task: final status requirements not satisfied (${validation.errors.join(
          ', '
        )})`
      );
    }

    task.lifecycleState = TaskLifecycleState.CLOSED;
    task.state = TaskState.CLOSED;

    const savedTask = await this.taskRepository.save(task);

    // Reload with assignee relation
    const taskWithAssignee = await this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['assignee'],
    });

    if (!taskWithAssignee) {
      throw new Error('Failed to retrieve updated task');
    }

    return taskWithAssignee;
  }

  /**
   * Map numeric status + lifecycle state to the legacy TaskState enum
   * used by the current React UI.
   * Final statuses (status === maxStatus) are mapped to COMPLETED
   * to enable the close button in the UI.
   */
  private mapStatusToState(
    status: number,
    lifecycleState: TaskLifecycleState,
    type: TaskType
  ): TaskState {
    if (lifecycleState === TaskLifecycleState.CLOSED) {
      return TaskState.CLOSED;
    }

    // Get max status for this task type to determine if current status is final
    const handler = taskTypeRegistry.getHandler(type);
    const maxStatus = handler.getMaxStatus();

    // If this is the final status, map to COMPLETED (enables close button)
    if (status === maxStatus) {
      return TaskState.COMPLETED;
    }

    // Generic mapping for non-final statuses:
    // 1 -> DRAFT
    // 2 -> IN_PROGRESS
    // 3+ (but not final) -> REVIEW
    if (status <= 1) {
      return TaskState.DRAFT;
    }
    if (status === 2) {
      return TaskState.IN_PROGRESS;
    }
    // Status 3+ that isn't final maps to REVIEW
    return TaskState.REVIEW;
  }
}

