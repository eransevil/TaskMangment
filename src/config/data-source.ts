import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Task } from '../entities/Task';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const getConfig = () => {
  const base = {
    type: 'postgres' as const,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User, Task],
    logging: false,
  };

  if (isProduction) {
    return {
      ...base,
      synchronize: false,
      migrations: ['dist/migrations/**/*.js'],
    };
  }

  return {
    ...base,
    host: base.host || 'localhost',
    username: base.username || 'postgres',
    password: base.password || 'postgres',
    database: base.database || 'task_management',
    synchronize: true,
    migrations: ['src/migrations/**/*.ts'],
  };
};

export const AppDataSource = new DataSource(getConfig());