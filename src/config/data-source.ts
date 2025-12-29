import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Task } from '../entities/Task';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource(
  isProduction
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL, // ⭐ Railway injects this
        synchronize: false,
        logging: false,
        entities: [User, Task],
        migrations: ['dist/migrations/**/*.js'],
        ssl: false, // Railway internal network
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'task_management',
        synchronize: true, // convenient locally
        logging: false,
        entities: [User, Task],
        migrations: ['src/migrations/**/*.ts'],
      }
);
