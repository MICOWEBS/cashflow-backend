import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Transaction from '../models/Transaction';
import Vendor from '../models/Vendor';
import Customer from '../models/Customer';
import { validateTransaction } from '../utils/validation';

interface AuthRequest extends Request {
  user?: any;
}

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = validateTransaction(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { type, amount, date, paymentMode, remarks, vendorId, customerId } = req.body;

    // Verify vendor/customer exists and belongs to user
    if (type === 'payment') {
      const vendor = await Vendor.findOne({
        where: { id: vendorId, userId: req.user.id }
      });
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
    } else {
      const customer = await Customer.findOne({
        where: { id: customerId, userId: req.user.id }
      });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
    }

    const transaction = await Transaction.create({
      type,
      amount,
      date,
      paymentMode,
      remarks,
      vendorId: type === 'payment' ? vendorId : null,
      customerId: type === 'sale' ? customerId : null,
      userId: req.user.id
    });

    const transactionWithDetails = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: Vendor,
          attributes: ['name', 'companyName']
        },
        {
          model: Customer,
          attributes: ['name', 'companyName']
        }
      ]
    });

    res.status(201).json(transactionWithDetails);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    const whereClause: any = {
      userId: req.user.id
    };

    if (type) {
      whereClause.type = type;
    }

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

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

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getTransactionSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause: any = {
      userId: req.user.id
    };

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    const sales = await Transaction.sum('amount', {
      where: { ...whereClause, type: 'sale' }
    });

    const payments = await Transaction.sum('amount', {
      where: { ...whereClause, type: 'payment' }
    });

    res.json({
      sales: sales || 0,
      payments: payments || 0,
      balance: (sales || 0) - (payments || 0)
    });
  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction summary' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = validateTransaction(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const transaction = await Transaction.findOne({
      where: { id, userId: req.user.id }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { type, amount, date, paymentMode, remarks, vendorId, customerId } = req.body;

    // Verify vendor/customer exists and belongs to user
    if (type === 'payment') {
      const vendor = await Vendor.findOne({
        where: { id: vendorId, userId: req.user.id }
      });
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
    } else {
      const customer = await Customer.findOne({
        where: { id: customerId, userId: req.user.id }
      });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
    }

    await transaction.update({
      type,
      amount,
      date,
      paymentMode,
      remarks,
      vendorId: type === 'payment' ? vendorId : null,
      customerId: type === 'sale' ? customerId : null
    });

    const updatedTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: Vendor,
          attributes: ['name', 'companyName']
        },
        {
          model: Customer,
          attributes: ['name', 'companyName']
        }
      ]
    });

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOne({
      where: { id, userId: req.user.id }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await transaction.destroy();
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
}; 