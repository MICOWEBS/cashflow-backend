import { Request, Response } from 'express';
import Admin from '../models/Admin';
import AdminSession from '../models/AdminSession';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { sendEmail } from '../services/emailService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';
import { getDeviceInfo } from '../utils/deviceInfo';

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/admin';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
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
}).single('image');

interface AuthRequest extends Request {
  admin?: any;
}

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!admin.isVerified) {
      return res.status(401).json({ error: 'Please verify your email first' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    // Generate token with proper payload
    const tokenPayload = {
      id: admin.id,
      role: admin.role || 'admin',
      email: admin.email
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Get device info for session logging
    const deviceInfo = getDeviceInfo(req);
    
    // Check for duplicate session
    const recentSession = await AdminSession.findOne({
      where: {
        adminId: admin.id,
        ipAddress: req.ip,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.operatingSystem,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      }
    });

    // Only log if no recent session exists
    if (!recentSession) {
      await AdminSession.create({
        adminId: admin.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.operatingSystem,
        location: deviceInfo.location,
        status: 'success'
      });
    }

    res.json({
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phone: admin.phone,
        image: admin.image,
        role: admin.role
      },
      token
    });
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const admin = await Admin.findByPk(req.admin.id, {
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry', 'verificationToken'] }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    const admin = await Admin.findByPk(req.admin.id);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Handle image upload
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      // If there's a new image, delete the old one and update the image path
      if (req.file) {
        // Delete old image if it exists
        if (admin.image) {
          const oldImagePath = path.join(__dirname, '..', '..', admin.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        // Update image path
        admin.image = `uploads/admin/${req.file.filename}`;
      }

      // If email is being changed, require re-verification
      if (email && email !== admin.email) {
        const existingAdmin = await Admin.findOne({ where: { email } });
        if (existingAdmin) {
          return res.status(400).json({ error: 'Email already in use' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        admin.email = email;
        admin.isVerified = false;
        admin.verificationToken = verificationToken;
        await admin.save();

        // Send verification email
        const verificationUrl = `${process.env.ADMIN_FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await sendEmail({
          to: email,
          subject: 'Verify New Email',
          text: `Please click the following link to verify your new email: ${verificationUrl}`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1>Email Verification</h1>
              <p>Click the link below to verify your new email:</p>
              <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
            </div>
          `
        });

        return res.json({ 
          message: 'Profile updated. Please verify your new email.',
          admin: {
            id: admin.id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            phone: admin.phone,
            image: admin.image,
            isVerified: admin.isVerified
          }
        });
      }

      // Update other fields
      admin.firstName = firstName || admin.firstName;
      admin.lastName = lastName || admin.lastName;
      admin.phone = phone || admin.phone;
      await admin.save();

    res.json({
        message: 'Profile updated successfully',
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          phone: admin.phone,
          image: admin.image,
          isVerified: admin.isVerified
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(404).json({ error: 'No admin found with this email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    admin.resetToken = resetToken;
    admin.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    await admin.save();

    const resetUrl = `${process.env.ADMIN_FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Admin Password Reset',
      text: `Please click the following link to reset your password: ${resetUrl}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Password Reset Request</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
        </div>
      `
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const admin = await Admin.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!admin) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password
    admin.password = await bcrypt.hash(newPassword, 10);
    admin.resetToken = undefined;
    admin.resetTokenExpiry = undefined;
    await admin.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const admin = await Admin.findOne({
      where: {
        verificationToken: token,
      },
    });

    if (!admin) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    admin.isVerified = true;
    admin.verificationToken = undefined;
    await admin.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const adminSignup = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new admin
    const admin = await Admin.create({
      firstName,
      lastName,
      email,
      password,
      isVerified: true, // Set as verified by default
      role: 'admin' // Default role
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin account created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role
      },
      token
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ error: 'Failed to create admin account' });
  }
}; 