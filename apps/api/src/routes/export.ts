import { Router } from 'express';
import {
  exportFamilyData,
  exportUserData,
  createBackup,
} from '../controllers/exportController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// All export routes require authentication
router.use(requireAuth);

// User data export (accessible to all authenticated users)
router.get('/my-data', exportUserData);

// Family data export (admin only)
router.get('/family-data', requireAdmin, exportFamilyData);

// Full backup creation (admin only)
router.post('/backup', requireAdmin, createBackup);

export default router;