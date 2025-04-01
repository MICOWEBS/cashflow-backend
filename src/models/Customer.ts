import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class Customer extends Model {
  public id!: number;
  public userId!: string;
  public name!: string;
  public companyName?: string;
  public email?: string;
  public phone?: string;
  public address?: string;
  public notes?: string;
}

Customer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Customer',
    timestamps: true,
  }
);

Customer.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Customer, { foreignKey: 'userId' });

export default Customer; 