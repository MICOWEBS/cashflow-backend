import express, { RequestHandler } from 'express';
import { 
  adminLogin, 
  forgotPassword, 
  resetPassword, 
  verifyEmail,
  getProfile,
  updateProfile,
  adminSignup
} from '../controllers/adminController';
import { adminAuth } from '../middlewares/adminAuth';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/admin' });

// Public routes (no authentication required)
router.post('/login', adminLogin as RequestHandler);
router.post('/signup', adminSignup as RequestHandler);
router.post('/forgot-password', forgotPassword as RequestHandler);
router.post('/reset-password', resetPassword as RequestHandler);
router.get('/verify-email/:token', verifyEmail as RequestHandler);

// Protected routes (require authentication)
router.use(adminAuth);
router.get('/profile', getProfile as RequestHandler);
router.put('/profile', upload.single('image'), updateProfile as RequestHandler);

export default router; 