import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import Vendor from '../models/Vendor';
import Customer from '../models/Customer';
import { ReportService } from '../services/reportService';
import { Op, fn, col, where, literal } from 'sequelize';

interface AuthRequest extends Request {
  user?: any;
}

const getDateRange = (range: string) => {
  const today = new Date();
  const startDate = new Date();

  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(today.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(today.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(today.getFullYear() - 1);
      break;
    default:
      return null;
  }

  return {
    startDate,
    endDate: today
  };
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const {
      dateRange,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const type = req.params.type === 'received' ? 'sale' : 'payment';

    const whereClause: any = {
      userId: req.user.id,
      type
    };

    // Apply date range filter
    if (dateRange) {
      const range = getDateRange(dateRange as string);
      if (range) {
        whereClause.date = {
          [Op.between]: [range.startDate, range.endDate]
        };
      }
    } else if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    // Apply search filter
    if (search) {
      whereClause[Op.or] = [
        { remarks: { [Op.like]: `%${search}%` } },
        { paymentMode: { [Op.like]: `%${search}%` } },
        literal(`DATE_FORMAT(date, '%Y-%m-%d') LIKE '%${search}%'`)
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);
    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Vendor,
          attributes: ['name', 'companyName'],
          where: search ? {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } },
              { companyName: { [Op.like]: `%${search}%` } }
            ]
          } : undefined,
          required: false
        },
        {
          model: Customer,
          attributes: ['name', 'companyName'],
          where: search ? {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } },
              { companyName: { [Op.like]: `%${search}%` } }
            ]
          } : undefined,
          required: false
        }
      ],
      order: [['date', 'DESC']],
      limit: Number(limit),
      offset
    });

    // Calculate summary statistics
    const allTransactions = await Transaction.findAll({
      where: whereClause,
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
      order: [['date', 'ASC']]
    });

    const totalAmount = allTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const averageAmount = allTransactions.length > 0 ? totalAmount / allTransactions.length : 0;
    
    // Calculate growth
    let growth = 0;
    if (allTransactions.length >= 2) {
      const firstAmount = Number(allTransactions[0].amount);
      const lastAmount = Number(allTransactions[allTransactions.length - 1].amount);
      growth = ((lastAmount - firstAmount) / firstAmount) * 100;
    }

    // Format the response to match the frontend expectations
    const formattedTransactions = transactions.rows.map(transaction => ({
      id: transaction.id,
      date: transaction.date,
      amount: Number(transaction.amount),
      customerName: transaction.type === 'sale' ? transaction.Customer?.name : transaction.Vendor?.name,
      paymentMode: transaction.paymentMode,
      description: transaction.remarks
    }));

    res.json({
      transactions: formattedTransactions,
      summary: {
        totalAmount: Number(totalAmount.toFixed(2)),
        averageAmount: Number(averageAmount.toFixed(2)),
        transactionCount: allTransactions.length,
        growth: Number(growth.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const {
      type,
      dateRange,
      startDate,
      endDate,
      search,
      format
    } = req.query;

    const whereClause: any = {
      userId: req.user.id
    };

    // Apply type filter (payment/sale)
    if (type) {
      whereClause.type = type;
    }

    // Apply date range filter
    if (dateRange) {
      const range = getDateRange(dateRange as string);
      if (range) {
        whereClause.date = {
          [Op.between]: [range.startDate, range.endDate]
        };
      }
    } else if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    // Apply search filter
    if (search) {
      whereClause[Op.or] = [
        { remarks: { [Op.like]: `%${search}%` } },
        { paymentMode: { [Op.like]: `%${search}%` } },
        literal(`DATE_FORMAT(date, '%Y-%m-%d') LIKE '%${search}%'`)
      ];
    }

    // Fetch transactions with related data
    const transactions = await Transaction.findAll({
      where: whereClause,
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
      order: [['date', 'DESC']]
    });

    // Generate report based on format
    if (format === 'pdf') {
      const pdfStream = await ReportService.generatePDFReport(transactions);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${type || 'all'}_transactions.pdf`);
      pdfStream.pipe(res);
    } else if (format === 'xlsx') {
      const buffer = await ReportService.generateExcelReport(transactions);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${type || 'all'}_transactions.xlsx`);
      res.send(buffer);
    } else {
      res.status(400).json({ error: 'Invalid format specified' });
    }
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
}; 