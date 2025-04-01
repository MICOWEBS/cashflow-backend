import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Customer from '../models/Customer';
import Vendor from '../models/Vendor';
import { validateCustomerVendor } from '../utils/validation';
import Tag from '../models/Tag';

interface AuthRequest extends Request {
  user?: any;
}

// Customer Controllers
export const createCustomer = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { error } = validateCustomerVendor(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, phone, companyName, address, notes } = req.body;
    
    // Check if email already exists
    const existingCustomer = await Customer.findOne({ where: { email } });
    if (existingCustomer) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      companyName,
      address,
      notes,
      userId: req.user?.id
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

export const getCustomers = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const customers = await Customer.findAll({
      where: { userId: req.user?.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { error } = validateCustomerVendor(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email } = req.body;
    
    // Check if email is being changed and if it's already in use
    const existingCustomer = await Customer.findOne({
      where: {
        email,
        id: { [Op.ne]: id }
      }
    });
    if (existingCustomer) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await customer.update(req.body);
    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await customer.destroy();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};

// Vendor Controllers
export const createVendor = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { error } = validateCustomerVendor(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, phone, companyName, address, notes } = req.body;
    
    // Check if email already exists
    const existingVendor = await Vendor.findOne({ where: { email } });
    if (existingVendor) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const vendor = await Vendor.create({
      name,
      email,
      phone,
      companyName,
      address,
      notes,
      userId: req.user?.id
    });

    res.status(201).json(vendor);
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
};

export const getVendors = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const vendors = await Vendor.findAll({
      where: { userId: req.user?.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(vendors);
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
};

export const updateVendor = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { error } = validateCustomerVendor(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email } = req.body;
    
    // Check if email is being changed and if it's already in use
    const existingVendor = await Vendor.findOne({
      where: {
        email,
        id: { [Op.ne]: id }
      }
    });
    if (existingVendor) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const vendor = await Vendor.findOne({
      where: { 
        id,
        userId: req.user?.id
      }
    });
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    await vendor.update(req.body);
    res.json(vendor);
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
};

export const deleteVendor = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findOne({
      where: { 
        id,
        userId: req.user?.id
      }
    });
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    await vendor.destroy();
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
}; 