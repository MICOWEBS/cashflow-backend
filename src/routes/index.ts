import { Application } from 'express';
import express from 'express';
import authRoutes from './authRoutes';
import transactionRoutes from './transactions';
import customerVendorRoutes from './customerVendor';
import reportRoutes from './reports';
import adminRoutes from './admin';
import tagRoutes from './tagRoutes';
import activityRoutes from './activityRoutes';
import dashboardRoutes from './dashboard';
import adminMenuRoutes from './adminMenu';
import { authLimiter } from '../middlewares/rateLimiter';

export const setupRoutes = (app: Application): void => {
  // Create main router
  const router = express.Router();

  // Apply rate limiting to all routes
  router.use(authLimiter);

  // Public routes (no authentication required)
  router.use('/auth', authRoutes);
  router.use('/admin/login', adminRoutes);
  router.use('/admin/forgot-password', adminRoutes);
  router.use('/admin/reset-password', adminRoutes);
  router.use('/admin/verify-email', adminRoutes);

  // Protected routes (require authentication)
  router.use('/admin', adminRoutes);
  router.use('/admin/menu', adminMenuRoutes);
  router.use('/transactions', transactionRoutes);
  router.use('/customers', customerVendorRoutes);
  router.use('/vendors', customerVendorRoutes);
  router.use('/reports', reportRoutes);
  router.use('/tags', tagRoutes);
  router.use('/activity', activityRoutes);
  router.use('/dashboard', dashboardRoutes);

  // API Health Check
  router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running' });
  });

  // Mount all routes under /api prefix
  app.use('/api', router);
}; 