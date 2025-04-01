import express from 'express';
import { auth } from '../middlewares/auth';
import { upload } from '../middlewares/fileUpload';
import {
  createCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  createVendor,
  getVendors,
  updateVendor,
  deleteVendor,
} from '../controllers/customerVendorController';
import { asyncHandler } from '../utils/routeHandler';

const router = express.Router();

router.use(auth);

// Customer routes
router.post('/customers', asyncHandler(createCustomer));
router.get('/customers', asyncHandler(getCustomers));
router.put('/customers/:id', asyncHandler(updateCustomer));
router.delete('/customers/:id', asyncHandler(deleteCustomer));

// Vendor routes
router.post('/vendors', asyncHandler(createVendor));
router.get('/vendors', asyncHandler(getVendors));
router.put('/vendors/:id', asyncHandler(updateVendor));
router.delete('/vendors/:id', asyncHandler(deleteVendor));

export default router; 