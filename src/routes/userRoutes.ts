import express from 'express';
import multer from 'multer';
import path from 'path';
import { auth } from '../middlewares/auth';
import { 
  updateProfile, 
  updateEmail, 
  verifyEmailChange 
} from '../controllers/userController';

const router = express.Router();

// Configure multer for profile image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// All routes require authentication
router.use(auth);

// Update profile (including profile image)
router.put('/profile', upload.single('profileImage'), updateProfile);

// Update email (requires verification)
router.put('/email', updateEmail);

// Verify email change
router.post('/email/verify', verifyEmailChange);

export default router; 