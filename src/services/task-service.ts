import { Repository } from 'typeorm';
import {
  Task,
  TaskLifecycleState,
  TaskState,
  TaskType,
} from '../entities/Task';
import { User } from '../entities/User';
import { Direction, changeStatus, closeTask as validateCloseTask } from '../core/workflow';
import { getHandler } from '../core/task-type-registry';

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

async function reloadTaskWithAssignee(
  taskRepository: Repository<Task>,
  taskId: string
): Promise<Task> {
  const task = await taskRepository.findOne({
    where: { id: taskId },
    relations: ['assignee'],
  });
  if (!task) {
    throw new Error('Failed to retrieve task');
  }
  return task;
}

function mapStatusToState(
  status: number,
  lifecycleState: TaskLifecycleState,
  type: TaskType
): TaskState {
  if (lifecycleState === TaskLifecycleState.CLOSED) {
    return TaskState.CLOSED;
  }

  const handler = getHandler(type);
  const maxStatus = handler.getMaxStatus();

  if (status === maxStatus) {
    return TaskState.COMPLETED;
  }

  if (status <= 1) {
    return TaskState.DRAFT;
  }
  if (status === 2) {
    return TaskState.IN_PROGRESS;
  }
  return TaskState.REVIEW;
}

export async function createTask(
  taskRepository: Repository<Task>,
  userRepository: Repository<User>,
  dto: CreateTaskDto
): Promise<Task> {
  const assignee = await userRepository.findOne({
    where: { id: dto.assigneeId },
  });

  if (!assignee) {
    throw new Error(`User with id ${dto.assigneeId} not found`);
  }

  const handler = getHandler(dto.type);
  const initialStatus = 1;
  const customFields = dto.customFields || {};
  
  const validation = handler.validateStatusRequirements(initialStatus, customFields);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  const transformedFields = handler.transformFields(initialStatus, customFields);

  const task = taskRepository.create({
    title: dto.title,
    description: dto.description || null,
    type: dto.type,
    status: initialStatus,
    lifecycleState: TaskLifecycleState.OPEN,
    state: mapStatusToState(initialStatus, TaskLifecycleState.OPEN, dto.type),
    assigneeId: dto.assigneeId,
    customFields: transformedFields,
  });

  const savedTask = await taskRepository.save(task);
  return reloadTaskWithAssignee(taskRepository, savedTask.id);
}

export async function getTaskById(
  taskRepository: Repository<Task>,
  id: string
): Promise<Task | null> {
  return await taskRepository.findOne({
    where: { id },
    relations: ['assignee'],
  });
}

export async function getTasksByUser(
  taskRepository: Repository<Task>,
  userId: string
): Promise<Task[]> {
  return await taskRepository.find({
    where: { assigneeId: userId },
    relations: ['assignee'],
    order: { createdAt: 'DESC' },
  });
}

export async function getAllTasks(
  taskRepository: Repository<Task>
): Promise<Task[]> {
  return await taskRepository.find({
    relations: ['assignee'],
    order: { createdAt: 'DESC' },
  });
}

export async function updateTask(
  taskRepository: Repository<Task>,
  id: string,
  dto: UpdateTaskDto
): Promise<Task> {
  const task = await getTaskById(taskRepository, id);
  if (!task) {
    throw new Error(`Task with id ${id} not found`);
  }

  if (task.lifecycleState === TaskLifecycleState.CLOSED) {
    throw new Error('Closed tasks are immutable');
  }

  if (dto.customFields !== undefined) {
    const handler = getHandler(task.type);
    const existingFields = task.customFields || {};
    const mergedFields = { ...existingFields, ...dto.customFields };
    
    const validation = handler.validateStatusRequirements(task.status, mergedFields);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    task.customFields = handler.transformFields(task.status, mergedFields);
  }

  if (dto.title !== undefined) {
    task.title = dto.title;
  }

  if (dto.description !== undefined) {
    task.description = dto.description;
  }

  const savedTask = await taskRepository.save(task);
  return reloadTaskWithAssignee(taskRepository, savedTask.id);
}

export async function changeTaskStatus(
  taskRepository: Repository<Task>,
  userRepository: Repository<User>,
  id: string,
  dto: ChangeStatusDto
): Promise<Task> {
  const task = await getTaskById(taskRepository, id);
  if (!task) {
    throw new Error(`Task with id ${id} not found`);
  }

  if (task.lifecycleState === TaskLifecycleState.CLOSED) {
    throw new Error('Closed tasks are immutable');
  }

  const handler = getHandler(task.type);
  const maxStatus = handler.getMaxStatus();

  const result = changeStatus(
    task.status,
    maxStatus,
    dto.direction,
    task.lifecycleState
  );

  if (!result.success || result.nextStatus === undefined) {
    throw new Error(result.error || 'Cannot change task status');
  }

  const nextStatus = result.nextStatus;
  const existingFields = task.customFields || {};
  const providedFields = dto.customFields || {};
  const mergedFields = { ...existingFields, ...providedFields };

  if (dto.direction === 'forward') {
    const validation = handler.validateStatusRequirements(nextStatus, mergedFields);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  let nextAssigneeId = task.assigneeId;
  if (dto.nextAssigneeId && dto.nextAssigneeId !== task.assigneeId) {
    const nextAssignee = await userRepository.findOne({
      where: { id: dto.nextAssigneeId },
    });
    if (!nextAssignee) {
      throw new Error(`User with id ${dto.nextAssigneeId} not found`);
    }
    nextAssigneeId = dto.nextAssigneeId;
  }

  task.status = nextStatus;
  task.lifecycleState = TaskLifecycleState.OPEN;
  task.state = mapStatusToState(nextStatus, TaskLifecycleState.OPEN, task.type);
  task.assigneeId = nextAssigneeId;

  if (dto.direction === 'forward') {
    task.customFields = handler.transformFields(nextStatus, mergedFields);
  } else {
    task.customFields = existingFields;
  }

  const savedTask = await taskRepository.save(task);
  return reloadTaskWithAssignee(taskRepository, savedTask.id);
}

export async function advanceTask(
  taskRepository: Repository<Task>,
  userRepository: Repository<User>,
  id: string,
  dto: Omit<ChangeStatusDto, 'direction'> = {}
): Promise<Task> {
  return changeTaskStatus(taskRepository, userRepository, id, { ...dto, direction: 'forward' });
}

export async function reverseTask(
  taskRepository: Repository<Task>,
  userRepository: Repository<User>,
  id: string,
  dto: Omit<ChangeStatusDto, 'direction'> = {}
): Promise<Task> {
  return changeTaskStatus(taskRepository, userRepository, id, { ...dto, direction: 'backward' });
}

export async function closeTask(
  taskRepository: Repository<Task>,
  id: string
): Promise<Task> {
  const task = await getTaskById(taskRepository, id);
  if (!task) {
    throw new Error(`Task with id ${id} not found`);
  }

  const handler = getHandler(task.type);
  const maxStatus = handler.getMaxStatus();

  const result = validateCloseTask(task.status, maxStatus, task.lifecycleState);
  if (!result.success) {
    throw new Error(result.error || 'Cannot close task');
  }

  const fields = task.customFields || {};
  const validation = handler.validateStatusRequirements(task.status, fields);
  if (!validation.valid) {
    throw new Error(
      `Cannot close task: final status requirements not satisfied (${validation.errors.join(', ')})`
    );
  }

  task.lifecycleState = TaskLifecycleState.CLOSED;
  task.state = TaskState.CLOSED;

  const savedTask = await taskRepository.save(task);
  return reloadTaskWithAssignee(taskRepository, savedTask.id);
}