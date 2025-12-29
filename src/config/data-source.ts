import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Task } from '../entities/Task';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'task_management',
  synchronize: process.env.NODE_ENV !== 'production', // Auto-sync in dev, use migrations in prod
  logging: false,
  entities: [User, Task],
  migrations: ['dist/migrations/**/*.js'],
  subscribers: ['src/subscribers/**/*.ts'],
});

