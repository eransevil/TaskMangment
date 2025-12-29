import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../entities/User';
import { Task } from '../entities/Task';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const createDataSourceConfig = (): DataSourceOptions => {
  const commonConfig = {
    type: 'postgres' as const,
    entities: [User, Task],
    logging: !isProduction,
  };

  if (isProduction && process.env.DATABASE_URL) {
    return {
      ...commonConfig,
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      migrations: ['dist/migrations/**/*.js'],
      synchronize: false,
    };
  }

  return {
    ...commonConfig,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'task_management',
    migrations: ['src/migrations/**/*.ts'],
    synchronize: true,
  };
};

export const AppDataSource = new DataSource(createDataSourceConfig());