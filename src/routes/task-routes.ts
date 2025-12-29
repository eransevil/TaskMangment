import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { TaskService } from '../services/task-service';
import { Task } from '../entities/Task';
import { User } from '../entities/User';

const router = Router();
const taskService = new TaskService(
  AppDataSource.getRepository(Task),
  AppDataSource.getRepository(User)
);

// Get all tasks
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const tasks = userId
      ? await taskService.getTasksByUser(userId)
      : await taskService.getAllTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get task by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create task
router.post('/', async (req: Request, res: Response) => {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Update task
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    res.json(task);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes('not found')) {
      return res.status(404).json({ error: message });
    }
    res.status(400).json({ error: message });
  }
});

// Advance task
router.post('/:id/advance', async (req: Request, res: Response) => {
  try {
    const task = await taskService.advanceTask(req.params.id, req.body);
    res.json(task);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes('not found')) {
      return res.status(404).json({ error: message });
    }
    res.status(400).json({ error: message });
  }
});

// Reverse task
router.post('/:id/reverse', async (req: Request, res: Response) => {
  try {
    const task = await taskService.reverseTask(req.params.id, req.body);
    res.json(task);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes('not found')) {
      return res.status(404).json({ error: message });
    }
    res.status(400).json({ error: message });
  }
});

// Close task
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const task = await taskService.closeTask(req.params.id);
    res.json(task);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes('not found')) {
      return res.status(404).json({ error: message });
    }
    res.status(400).json({ error: message });
  }
});

export default router;

