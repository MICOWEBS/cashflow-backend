import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';
import UserSession from '../models/UserSession';
import { validateRegistration, validateLogin } from '../utils/validation';
import crypto from 'crypto';
import config from '../config/config';
import { sendEmail } from '../services/emailService';
import { getDeviceInfo } from '../utils/deviceInfo';
import { logActivity } from '../utils/activityLogger';

interface AuthRequest extends Request {
  user?: {
    id: number;
  };
}

interface PendingRegistration {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  otp: string;
  expiresAt: Date;
}

const pendingRegistrations = new Map<string, PendingRegistration>();

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { email, password, firstName, lastName, phone } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const pendingUser = {
      id: uuidv4(),
      email,
      password, 
      firstName,
      lastName,
      phone,
      otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };

    pendingRegistrations.set(email, pendingUser);

    await sendEmail({
      to: email,
      subject: 'Verify your email',
      text: `Your OTP is: ${otp}`
    });

    await logActivity({
      userId: String(pendingUser.id),
      action: 'REGISTER',
      details: `New user registration initiated for ${email}`,
      req
    });

    res.status(201).json({
      message: 'Registration initiated. Please check your email for OTP.',
      userId: pendingUser.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
      return;
    }

    const pendingUser = pendingRegistrations.get(email);
    if (!pendingUser) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired registration attempt. Please register again.'
      });
      return;
    }

    // Convert both OTPs to strings for comparison
    const providedOTP = String(otp);
    const storedOTP = String(pendingUser.otp);

    if (providedOTP !== storedOTP) {
      res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please check and try again.'
      });
      return;
    }

    if (pendingUser.expiresAt < new Date()) {
      pendingRegistrations.delete(email);
      res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.'
      });
      return;
    }

    try {
      const user = await User.create({
        id: pendingUser.id,
        email: pendingUser.email,
        password: pendingUser.password,
        firstName: pendingUser.firstName,
        lastName: pendingUser.lastName,
        phone: pendingUser.phone,
        isVerified: true,
        status: 'active'
      });

      pendingRegistrations.delete(email);

      await logActivity({
        userId: String(user.id),
        action: 'EMAIL_VERIFIED',
        details: `Email verified for user ${email}`,
        req
      });

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phone
        }
      });
    } catch (dbError) {
      console.error('Database error during user creation:', dbError);
      res.status(500).json({
        success: false,
        error: 'Failed to create user account. Please try again.'
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during verification. Please try again.'
    });
  }
};

export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const pendingUser = pendingRegistrations.get(email);
    if (!pendingUser) {
      res.status(400).json({ error: 'No pending registration found' });
      return;
    }

    const newOTP = generateOTP();
    console.log('\x1b[33m%s\x1b[0m', `[DEV] New OTP for ${email}: ${newOTP}`);
    
    // Update pending registration
    pendingRegistrations.set(email, {
      ...pendingUser,
      otp: newOTP,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });

    // Send new verification email
    await sendEmail({
      to: email,
      subject: 'Email Verification',
      text: `Your new verification code is: ${newOTP}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Email Verification</h1>
          <p>Your new verification code is: <strong>${newOTP}</strong></p>
          <p>This code will expire in 30 minutes.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    await user.update({
      resetToken,
      resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
    });

    await logActivity({
      userId: String(user.id),
      action: 'FORGOT_PASSWORD',
      details: 'Password reset requested',
      req
    });

    res.json({ message: 'Password reset instructions sent to email' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.isVerified) {
      res.status(401).json({ error: 'Please verify your email first' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Get device info and create session
    const deviceInfo = getDeviceInfo(req);
    
    // Check for existing active session with same device info
    const existingSession = await UserSession.findOne({
      where: {
        userId: user.id,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        operatingSystem: deviceInfo.operatingSystem,
        status: 'active'
      }
    });

    if (!existingSession) {
      await UserSession.create({
        userId: user.id,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        operatingSystem: deviceInfo.operatingSystem,
        ipAddress: deviceInfo.ipAddress,
        location: deviceInfo.location,
        status: 'active',
        loginTime: new Date(),
        lastActive: new Date()
      });
    } else {
      // Update last active time of existing session
      await existingSession.update({
        lastActive: new Date(),
        ipAddress: deviceInfo.ipAddress,
        location: deviceInfo.location
      });
    }

    await logActivity({
      userId: String(user.id),
      action: 'LOGIN',
      details: `User logged in successfully from ${deviceInfo.deviceName}`,
      req
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    await logActivity({
      userId: String(user.id),
      action: 'PASSWORD_RESET',
      details: 'Password reset completed successfully',
      req
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Add a new endpoint to get user sessions
export const getUserSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { range } = req.query;
    let whereClause: any = { userId };
    let dateFilter: any = {};

    // Apply date range filter if provided
    if (range) {
      const now = new Date();
      switch (range) {
        case 'today':
          dateFilter = {
            [Op.gte]: new Date(now.setHours(0, 0, 0, 0))
          };
          break;
        case 'week':
          dateFilter = {
            [Op.gte]: new Date(now.setDate(now.getDate() - 7))
          };
          break;
        case 'month':
          dateFilter = {
            [Op.gte]: new Date(now.setMonth(now.getMonth() - 1))
          };
          break;
        case 'year':
          dateFilter = {
            [Op.gte]: new Date(now.setFullYear(now.getFullYear() - 1))
          };
          break;
      }
      whereClause.loginTime = dateFilter;
    }

    const sessions = await UserSession.findAll({
      where: whereClause,
      order: [['loginTime', 'DESC']],
      attributes: [
        'id',
        'deviceName',
        'browser',
        'operatingSystem',
        'ipAddress',
        'location',
        'loginTime',
        'lastActive',
        'status'
      ]
    });

    res.json(sessions);
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch user sessions' });
  }
};

// Add a new endpoint to terminate a session
export const terminateSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const session = await UserSession.findOne({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    await session.update({ status: 'inactive' });
    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
}; 