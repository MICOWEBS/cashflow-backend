import express from 'express';
import { auth } from '../middlewares/auth';
import { getActivityLogs } from '../controllers/activityController';

const router = express.Router();

router.get('/activity-logs', auth, getActivityLogs);

export default router; 