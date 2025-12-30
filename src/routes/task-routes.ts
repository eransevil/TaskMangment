import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import * as taskService from '../services/task-service';
import { Task } from '../entities/Task';
import { User } from '../entities/User';

const router = Router();
const taskRepository = AppDataSource.getRepository(Task);
const userRepository = AppDataSource.getRepository(User);

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const tasks = userId
      ? await taskService.getTasksByUser(taskRepository, userId)
      : await taskService.getAllTasks(taskRepository);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await taskService.getTaskById(taskRepository, req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const task = await taskService.createTask(taskRepository, userRepository, req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const task = await taskService.updateTask(taskRepository, req.params.id, req.body);
    res.json(task);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes('not found')) {
      return res.status(404).json({ error: message });
    }
    res.status(400).json({ error: message });
  }
});

router.post('/:id/advance', async (req: Request, res: Response) => {
  try {
    const task = await taskService.advanceTask(taskRepository, userRepository, req.params.id, req.body);
    res.json(task);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes('not found')) {
      return res.status(404).json({ error: message });
    }
    res.status(400).json({ error: message });
  }
});

router.post('/:id/reverse', async (req: Request, res: Response) => {
  try {
    const task = await taskService.reverseTask(taskRepository, userRepository, req.params.id, req.body);
    res.json(task);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes('not found')) {
      return res.status(404).json({ error: message });
    }
    res.status(400).json({ error: message });
  }
});

router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const task = await taskService.closeTask(taskRepository, req.params.id);
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