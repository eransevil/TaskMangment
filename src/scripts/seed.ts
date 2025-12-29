import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import {
  Task,
  TaskLifecycleState,
  TaskState,
  TaskType,
} from '../entities/Task';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const userRepository = AppDataSource.getRepository(User);
    const taskRepository = AppDataSource.getRepository(Task);

    await AppDataSource.query('TRUNCATE TABLE "tasks" CASCADE;');
    await AppDataSource.query('TRUNCATE TABLE "users" CASCADE;');

    const users = [
      userRepository.create({
        name: 'Alice Johnson',
        email: 'alice@example.com',
      }),
      userRepository.create({
        name: 'Bob Smith',
        email: 'bob@example.com',
      }),
      userRepository.create({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
      }),
    ];

    const savedUsers = await userRepository.save(users);
    console.log(`Created ${savedUsers.length} users`);

    const tasks = [
      taskRepository.create({
        title: 'Purchase Office Supplies',
        description: 'Order new office supplies for Q1',
        type: TaskType.PROCUREMENT,
        status: 2,
        lifecycleState: TaskLifecycleState.OPEN,
        state: TaskState.IN_PROGRESS,
        assignee: savedUsers[0],
        customFields: {
          quote1: '5000 USD from Office Depot',
          quote2: '4800 USD from Staples',
        },
      }),
      taskRepository.create({
        title: 'Buy New Laptops',
        description: 'Procure 10 new laptops for the development team',
        type: TaskType.PROCUREMENT,
        status: 1,
        lifecycleState: TaskLifecycleState.OPEN,
        state: TaskState.DRAFT,
        assignee: savedUsers[1],
        customFields: {},
      }),
      taskRepository.create({
        title: 'Purchase Server Equipment',
        description: 'Buy new server hardware for production',
        type: TaskType.PROCUREMENT,
        status: 3,
        lifecycleState: TaskLifecycleState.OPEN,
        state: TaskState.COMPLETED,
        assignee: savedUsers[2],
        customFields: {
          receipt: 'REC-2024-003 - Server purchase completed on 2024-01-15',
        },
      }),
      taskRepository.create({
        title: 'Implement User Authentication',
        description: 'Add JWT-based authentication to the API',
        type: TaskType.DEVELOPMENT,
        status: 3,
        lifecycleState: TaskLifecycleState.OPEN,
        state: TaskState.REVIEW,
        assignee: savedUsers[0],
        customFields: {
          branch: 'feature/auth',
        },
      }),
      taskRepository.create({
        title: 'Build Task Management UI',
        description: 'Create React components for task management',
        type: TaskType.DEVELOPMENT,
        status: 4,
        lifecycleState: TaskLifecycleState.OPEN,
        state: TaskState.COMPLETED,
        assignee: savedUsers[2],
        customFields: {
          version: '1.0.0',
        },
      }),
      taskRepository.create({
        title: 'Fix Payment Gateway Integration',
        description: 'Resolve issues with payment processing',
        type: TaskType.DEVELOPMENT,
        status: 2,
        lifecycleState: TaskLifecycleState.OPEN,
        state: TaskState.IN_PROGRESS,
        assignee: savedUsers[1],
        customFields: {
          specification: 'Fix payment gateway timeout issues. Implement retry logic with exponential backoff. Update error handling to provide better user feedback.',
        },
      }),
      taskRepository.create({
        title: 'New Feature Development',
        description: 'Start work on new dashboard feature',
        type: TaskType.DEVELOPMENT,
        status: 1,
        lifecycleState: TaskLifecycleState.OPEN,
        state: TaskState.DRAFT,
        assignee: savedUsers[0],
        customFields: {},
      }),
    ];

    const savedTasks = await taskRepository.save(tasks);
    console.log(`Created ${savedTasks.length} tasks`);

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
