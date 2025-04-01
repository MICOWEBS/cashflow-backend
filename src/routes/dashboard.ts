import express from 'express';
import { auth } from '../middlewares/auth';
import { getPaymentStats, getRecentTransactions } from '../controllers/dashboardController';
import { RequestHandler } from 'express';

const router = express.Router();

router.use(auth);

// Get payment and sales statistics with optional period filter
router.get('/stats', getPaymentStats as RequestHandler);

// Get recent transactions with optional limit
router.get('/transactions/recent', getRecentTransactions as RequestHandler);

export default router; 