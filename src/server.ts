import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/data-source';
import { initializeTaskTypes } from './task-types';
import taskRoutes from './routes/task-routes';
import userRoutes from './routes/user-routes';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'https://task-mangment-two.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(express.json());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

initializeTaskTypes();

app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

let server: any;

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log('Shutting down gracefully...');
  
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
    });
  }
  
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
  
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  shutdown();
});

startServer();
