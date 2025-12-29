import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Task } from '../entities/Task';
import * as dotenv from 'dotenv';

dotenv.config();
console.log('process.env.NODE_ENV' ,process.env.NODE_ENV);
console.log('process.env.DATABASE_URL' ,process.env.DATABASE_URL);

const isProduction = process.env.NODE_ENV === 'production';

const productionConfig = process.env.DATABASE_URL
  ? {
      type: 'postgres' as const,
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      synchronize: false,
      logging: false,
      entities: [User, Task],
      migrations: ['dist/migrations/**/*.js'],
      subscribers: [],
    }
  : null;

const localConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'task_management',
  synchronize: true,
  logging: true,
  entities: [User, Task],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
};

export const AppDataSource = new DataSource(
  productionConfig && isProduction ? productionConfig : localConfig
);
