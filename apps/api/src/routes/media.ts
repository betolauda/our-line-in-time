import { Router } from 'express';
import {
  uploadMedia,
  uploadMultipleMedia,
  getMediaById,
  getMediaByMemoryId,
  deleteMedia,
} from '../controllers/mediaController';
import { requireAuth } from '../middleware/auth';
import { uploadSingle, uploadMultiple } from '../middleware/upload';

const router = Router();

// All media routes require authentication
router.use(requireAuth);

// Upload routes
router.post('/upload', uploadSingle, uploadMedia);
router.post('/upload/multiple', uploadMultiple, uploadMultipleMedia);

// Retrieval routes
router.get('/:id', getMediaById);
router.get('/memory/:memoryId', getMediaByMemoryId);

// Management routes
router.delete('/:id', deleteMedia);

export default router;