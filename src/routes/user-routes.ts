import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await userRepository.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await userRepository.findOne({
      where: { id: req.params.id },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;

