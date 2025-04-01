import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Vendor from './Vendor';
import Customer from './Customer';

class Transaction extends Model {
  public id!: number;
  public amount!: number;
  public date!: Date;
  public paymentMode!: 'Cash' | 'Check' | 'Credit Card';
  public remarks?: string;
  public userId!: string;
  public type!: 'payment' | 'sale';
  public vendorId?: number;
  public customerId?: number;

  // Associations
  public Vendor?: Vendor;
  public Customer?: Customer;
}

Transaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('payment', 'sale'),
      allowNull: false,
    },
    paymentMode: {
      type: DataTypes.ENUM('Cash', 'Check', 'Credit Card'),
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Vendor,
        key: 'id',
      },
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Customer,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
    timestamps: true
  }
);

Transaction.belongsTo(User, { foreignKey: 'userId' });
Transaction.belongsTo(Vendor, { foreignKey: 'vendorId' });
Transaction.belongsTo(Customer, { foreignKey: 'customerId' });

User.hasMany(Transaction, { foreignKey: 'userId' });
Vendor.hasMany(Transaction, { foreignKey: 'vendorId' });
Customer.hasMany(Transaction, { foreignKey: 'customerId' });

export default Transaction; 