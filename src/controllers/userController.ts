import { Request, Response, RequestHandler } from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';
import { validateUpdateProfile } from '../utils/validation';
import { sendEmail } from '../services/emailService';
import config from '../config/config';
import { generateOTP } from '../utils/helpers';


interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

export const updateProfile = (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, phone, currentPassword, newPassword } = req.body;
    const profileImage = req.file?.path; 

    // Validate the update data
    const { error } = validateUpdateProfile(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If trying to change password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set new password' });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Update user details
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    if (profileImage) {
      user.profileImage = profileImage;
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}) as RequestHandler;

export const updateEmail = (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { newEmail, currentPassword } = req.body;

    // Validate input
    if (!newEmail || !currentPassword) {
      return res.status(400).json({ error: 'New email and current password are required' });
    }

    // Check if new email is already in use
    const existingUser = await User.findOne({ where: { email: newEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Generate verification OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store pending email change
    user.pendingEmail = newEmail;
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpiry = otpExpiry;
    await user.save();

    // Send verification email
    await sendEmail({
      to: newEmail,
      subject: 'Verify New Email Address',
      text: `Your verification code is: ${otp}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Email Change Verification</h1>
          <p>Your verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 30 minutes.</p>
          <p>If you didn't request this change, please ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({
      message: 'Verification code sent to new email address'
    });
  } catch (error) {
    console.error('Email update error:', error);
    res.status(500).json({ error: 'Failed to initiate email change' });
  }
}) as RequestHandler;

export const verifyEmailChange = (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.pendingEmail || !user.emailVerificationOTP || !user.emailVerificationOTPExpiry) {
      return res.status(400).json({ error: 'No pending email change found' });
    }

    // Check OTP expiration
    if (user.emailVerificationOTPExpiry < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Verify OTP
    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Update email
    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpiry = undefined;
    await user.save();

    res.status(200).json({
      message: 'Email updated successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email change' });
  }
}) as RequestHandler; 