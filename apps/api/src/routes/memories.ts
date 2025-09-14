import { Router } from 'express';
import {
  createMemory,
  getMemories,
  getMemoryById,
  updateMemory,
  deleteMemory,
  searchMemoriesByLocation,
} from '../controllers/memoryController';
import { requireAuth, requireContributor } from '../middleware/auth';

const router = Router();

// All memory routes require authentication
router.use(requireAuth);

// CRUD routes
router.post('/', requireContributor, createMemory);
router.get('/', getMemories);
router.get('/search/location', searchMemoriesByLocation);
router.get('/:id', getMemoryById);
router.put('/:id', requireContributor, updateMemory);
router.delete('/:id', requireContributor, deleteMemory);

export default router;