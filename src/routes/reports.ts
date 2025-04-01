import express from 'express';
import { auth } from '../middlewares/auth';
import { generateReport, getTransactions } from '../controllers/reportController';

const router = express.Router();

router.use(auth);

// Get transactions for a specific type (received/made)
router.get('/:type', getTransactions);

// Export report in different formats
router.get('/:type/export', generateReport);

export default router; 