import { Task, User, TaskType } from './types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
console.log('API_BASE', API_BASE);


function validateUUID(id: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error(`Invalid UUID: ${id}`);
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function fetchTasks(userId?: string): Promise<Task[]> {
  if (userId) validateUUID(userId);
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return request<Task[]>(`/tasks${query}`);
}

export async function fetchTask(id: string): Promise<Task> {
  validateUUID(id);
  return request<Task>(`/tasks/${id}`);
}

export async function fetchUsers(): Promise<User[]> {
  return request<User[]>(`/users`);
}

export async function createTask(taskData: {
  title: string;
  description?: string;
  type: TaskType;
  assigneeId: string;
  customFields?: Record<string, any>;
}): Promise<Task> {
  validateUUID(taskData.assigneeId);
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function advanceTask(
  id: string,
  payload?: { nextAssigneeId?: string; customFields?: Record<string, any> }
): Promise<Task> {
  validateUUID(id);
  return request<Task>(`/tasks/${id}/advance`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function reverseTask(
  id: string,
  payload?: { nextAssigneeId?: string; customFields?: Record<string, any> }
): Promise<Task> {
  validateUUID(id);
  return request<Task>(`/tasks/${id}/reverse`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function closeTask(id: string): Promise<Task> {
  validateUUID(id);
  return request<Task>(`/tasks/${id}/close`, {
    method: 'POST',
  });
}
