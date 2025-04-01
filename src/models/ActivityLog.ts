import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class ActivityLog extends Model {
  public id!: string;
  public userId!: string;
  public action!: string;
  public details!: string;
  public timestamp!: Date;
  public ipAddress!: string;
  public userAgent!: string;
}

ActivityLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ActivityLog',
    tableName: 'activity_logs',
    timestamps: true,
  }
);

export default ActivityLog; 