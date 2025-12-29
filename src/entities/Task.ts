import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

/**
 * UI-facing state used mainly for display in the current React app.
 * The new workflow engine works with numeric `status` and `lifecycleState`
 * but we keep this enum to avoid breaking the existing client.
 */
export enum TaskState {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CLOSED = 'closed',
}

export enum TaskType {
  PROCUREMENT = 'procurement',
  DEVELOPMENT = 'development',
}

/**
 * Lifecycle of a task: open or closed.
 * Closed tasks are immutable according to the updated workflow rules.
 */
export enum TaskLifecycleState {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: TaskType,
  })
  type!: TaskType;

  /**
   * Integer status that encodes the position in the workflow:
   * 1, 2, 3, ... up to the task-type-specific maximum.
   */
  @Column({ type: 'int', default: 1 })
  status!: number;

  /**
   * Lifecycle state (open/closed). Closed tasks are immutable.
   */
  @Column({
    type: 'enum',
    enum: TaskLifecycleState,
    default: TaskLifecycleState.OPEN,
  })
  lifecycleState!: TaskLifecycleState;

  /**
   * Legacy / UI-facing state used by the current React client.
   * We keep it in sync with `status` + `lifecycleState` in the service layer.
   */
  @Column({
    type: 'enum',
    enum: TaskState,
    default: TaskState.DRAFT,
  })
  state!: TaskState;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'assignee_id' })
  assignee!: User;

  @Column({ name: 'assignee_id' })
  assigneeId!: string;

  @Column({ type: 'jsonb', nullable: true })
  customFields!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


