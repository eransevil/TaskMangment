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
  'http://localhost:3000'
];


// Middleware
app.use(express.json());

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    // מאפשר requests ללא origin (כמו Postman)
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
// Initialize task type registry
initializeTaskTypes();

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize database and start server
let server: any;

async function startServer() {
  try {
    // Use DATABASE_URL from env
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

// Graceful shutdown handler
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

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  shutdown();
});

startServer();
