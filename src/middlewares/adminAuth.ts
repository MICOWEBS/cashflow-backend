import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import { AppError } from './errorHandler';
import logger from '../utils/logger';

interface AdminAuthRequest extends Request {
  admin?: any;
}

export const adminAuth = async (req: AdminAuthRequest, res: Response, next: NextFunction) => {
  try {
    // Log all request headers for debugging
    logger.info('Request headers:', req.headers);

    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.error('No Bearer token found in request');
      return next(new AppError('Not authorized to access this route', 401));
    }

    const token = authHeader.split(' ')[1];
    logger.info('Raw token received:', token);

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET is not defined in environment variables');
      return next(new AppError('Server configuration error', 500));
    }

    // Verify token
    try {
      // Ensure token is a string and not an object
      if (typeof token !== 'string' || token === '[object Object]') {
        logger.error('Invalid token format:', token);
        return next(new AppError('Invalid token format', 401));
      }

      // Verify token is a valid JWT
      if (!/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token)) {
        logger.error('Token is not a valid JWT format');
        return next(new AppError('Invalid token format', 401));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string; role: string };
      logger.info('Token decoded successfully:', { id: decoded.id, role: decoded.role });
    
    // Check if admin exists
    const admin = await Admin.findByPk(decoded.id);
    if (!admin) {
        logger.error('Admin not found for ID:', decoded.id);
      return next(new AppError('Not authorized to access this route', 401));
    }

    // Check if admin role is valid
      const validRoles = ['admin', 'superadmin'];
      if (!validRoles.includes(admin.role)) {
        logger.error('Invalid admin role:', admin.role);
      return next(new AppError('Not authorized to access this route', 401));
    }

    // Add admin to request
    req.admin = admin;
    next();
    } catch (jwtError) {
      logger.error('JWT verification failed:', jwtError);
      if (jwtError instanceof jwt.TokenExpiredError) {
        return next(new AppError('Token has expired', 401));
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        return next(new AppError('Invalid token', 401));
      }
      return next(new AppError('Token verification failed', 401));
    }
  } catch (error) {
    logger.error('Admin auth error:', error);
    return next(new AppError('Not authorized to access this route', 401));
  }
}; 