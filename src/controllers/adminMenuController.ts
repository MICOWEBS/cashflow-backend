import { Request, Response } from 'express';
import User from '../models/User';
import AdminSession from '../models/AdminSession';
import { Op } from 'sequelize';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  admin?: any;
}

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get total users count
    const totalUsers = await User.count();

    // Get active (verified) users count
    const activeUsers = await User.count({
      where: {
        isVerified: true
      }
    });

    // Get inactive (unverified) users count
    const inactiveUsers = await User.count({
      where: {
        isVerified: false
      }
    });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build where clause for search
    const whereClause: any = {};
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // Get users with pagination and search
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'isVerified',
        'status',
        'createdAt',
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: offset
    });

    res.json({
      users: rows,
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getSessionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const sessions = await AdminSession.findAndCountAll({
      where: { adminId: req.admin.id },
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    });

    res.json({
      sessions: sessions.rows,
      total: sessions.count,
      totalPages: Math.ceil(sessions.count / Number(limit)),
      currentPage: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    logger.error('Session history error:', error);
    res.status(500).json({ error: 'Failed to fetch session history' });
  }
}; 