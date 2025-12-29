export enum TaskType {
  PROCUREMENT = 'procurement',
  DEVELOPMENT = 'development',
}

export enum TaskState {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CLOSED = 'closed',
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  state: TaskState;
  assignee: User;
  assigneeId: string;
  customFields: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

