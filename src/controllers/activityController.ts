import { Response } from 'express';
import ActivityLog from '../models/ActivityLog';
import { Op } from 'sequelize';
import { AuthRequest } from '../middlewares/auth';

export const getActivityLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { range } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

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
      whereClause.timestamp = dateFilter;
    }

    const activities = await ActivityLog.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']]
    });

    res.json(activities);
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
}; 