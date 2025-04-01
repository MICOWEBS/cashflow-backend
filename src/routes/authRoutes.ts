import express from 'express';
import { auth } from '../middlewares/auth';
import {
  register,
  verifyEmail,
  resendOTP,
  login,
  forgotPassword,
  resetPassword,
  getUserSessions,
  terminateSession
} from '../controllers/authController';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/sessions', auth, getUserSessions);
router.post('/sessions/:sessionId/terminate', auth, terminateSession);

// Admin-only route to reset rate limit (for development/testing)
if (process.env.NODE_ENV !== 'production') {
  router.get('/reset-rate-limit', (req, res) => {
    res.status(200).json({ 
      message: 'Rate limit reset endpoint available only in development mode',
      note: 'This endpoint is only for testing purposes'
    });
  });
}

export default router; 