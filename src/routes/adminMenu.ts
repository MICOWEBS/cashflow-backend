import express from 'express';
import { adminAuth } from '../middlewares/adminAuth';
import { 
  getDashboardStats,
  getUsers,
  getSessionHistory
} from '../controllers/adminMenuController';

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Dashboard statistics
router.get('/dashboard/stats', getDashboardStats);

// Users management
router.get('/users', getUsers);

// Session history
router.get('/sessions', getSessionHistory);

export default router; 