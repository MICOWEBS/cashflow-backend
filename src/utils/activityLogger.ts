import { Request } from 'express';
import ActivityLog from '../models/ActivityLog';
import { getDeviceInfo } from './deviceInfo';

interface LogActivityParams {
  userId: string;
  action: string;
  details: string;
  req: Request;
}

export const logActivity = async ({ userId, action, details, req }: LogActivityParams): Promise<void> => {
  try {
    const deviceInfo = getDeviceInfo(req);
    
    // Skip logging for registration since we don't have a valid user ID yet
    if (action === 'REGISTER') {
      return;
    }

    await ActivityLog.create({
      userId,
      action,
      details,
      ipAddress: deviceInfo.ipAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}; 