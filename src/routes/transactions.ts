import express from 'express';
import { auth } from '../middlewares/auth';
import {
  createTransaction,
  getTransactions,
  getTransactionSummary,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController';
import { asyncHandler } from '../utils/routeHandler';

const router = express.Router();

router.use(auth); // Protect all transaction routes

// Wrap controller functions in async handlers
router.post('/', asyncHandler(createTransaction));
router.get('/', asyncHandler(getTransactions));
router.get('/summary', asyncHandler(getTransactionSummary));
router.put('/:id', asyncHandler(updateTransaction));
router.delete('/:id', asyncHandler(deleteTransaction));

export default router; 