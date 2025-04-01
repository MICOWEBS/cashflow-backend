import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Admin from './Admin';

class AdminSession extends Model {
  public id!: number;
  public adminId!: number;
  public ipAddress!: string;
  public userAgent!: string;
  public deviceName!: string;
  public browser!: string;
  public os!: string;
  public location!: string;
  public status!: 'success' | 'failed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AdminSession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Admin,
        key: 'id',
      },
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deviceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    browser: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    os: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('success', 'failed'),
      defaultValue: 'success',
    },
  },
  {
    sequelize,
    tableName: 'admin_sessions',
  }
);

// Define associations
AdminSession.belongsTo(Admin, { foreignKey: 'adminId' });
Admin.hasMany(AdminSession, { foreignKey: 'adminId' });

export default AdminSession; 