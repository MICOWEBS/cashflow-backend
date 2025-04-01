import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import { Op } from 'sequelize';
import Vendor from '../models/Vendor';
import Customer from '../models/Customer';

interface AuthRequest extends Request {
  user?: {
    id: number;
  };
}

const getDateRange = (period: string) => {
  const today = new Date();
  const startDate = new Date();

  switch (period?.toLowerCase()) {
    case '7days':
    case '7d':
      startDate.setDate(today.getDate() - 7);
      break;
    case '14days':
    case '14d':
      startDate.setDate(today.getDate() - 14);
      break;
    case 'month':
    case '30d':
      startDate.setMonth(today.getMonth() - 1);
      break;
    case 'year':
    case '365d':
      startDate.setFullYear(today.getFullYear() - 1);
      break;
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(today.getDate() - 7);
      break;
    default:
      // Default to last 30 days if period is invalid
      startDate.setMonth(today.getMonth() - 1);
  }

  return {
    startDate,
    endDate: today
  };
};

export const getPaymentStats = async (req: AuthRequest, res: Response) => {
  try {
    const { period } = req.query;
    console.log('Received request for payment stats with period:', period);
    
    if (!req.user?.id) {
      console.error('No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const whereClause: any = {
      userId: req.user.id
    };

    // Apply date range filter if period is specified
    if (period) {
      const dateRange = getDateRange(period as string);
      if (dateRange) {
        whereClause.date = {
          [Op.between]: [dateRange.startDate, dateRange.endDate]
        };
        console.log('Date range:', {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        });
      }
    }

    // Get total payments made
    const totalPayments = await Transaction.sum('amount', {
      where: {
        ...whereClause,
        type: 'payment'
      }
    });

    // Get total sales received
    const totalSales = await Transaction.sum('amount', {
      where: {
        ...whereClause,
        type: 'sale'
      }
    });

    // Log the results for debugging
    console.log('Payment Stats:', {
      period: period || 'all',
      totalPayments,
      totalSales,
      whereClause
    });

    // Format numbers to 2 decimal places
    const formattedResponse = {
      period: period || 'all',
      totalPayments: Number((totalPayments || 0).toFixed(2)),
      totalSales: Number((totalSales || 0).toFixed(2)),
      balance: Number(((totalSales || 0) - (totalPayments || 0)).toFixed(2))
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getRecentTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 5 } = req.query;
    
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const transactions = await Transaction.findAll({
      where: {
        userId: req.user.id
      },
      include: [
        {
          model: Vendor,
          attributes: ['name', 'companyName']
        },
        {
          model: Customer,
          attributes: ['name', 'companyName']
        }
      ],
      order: [['date', 'DESC']],
      limit: Number(limit)
    });

    // Format the response to include vendor/customer names
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      amount: Number(transaction.amount),
      date: transaction.date,
      type: transaction.type,
      paymentMode: transaction.paymentMode,
      remarks: transaction.remarks,
      vendorName: transaction.type === 'payment' ? transaction.Vendor?.name : null,
      vendorCompany: transaction.type === 'payment' ? transaction.Vendor?.companyName : null,
      customerName: transaction.type === 'sale' ? transaction.Customer?.name : null,
      customerCompany: transaction.type === 'sale' ? transaction.Customer?.companyName : null
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch recent transactions' });
  }
}; 