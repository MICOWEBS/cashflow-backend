import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class UserSession extends Model {
  public id!: number;
  public userId!: string;
  public deviceName!: string;
  public ipAddress!: string;
  public location!: string;
  public browser!: string;
  public operatingSystem!: string;
  public loginTime!: Date;
  public lastActive!: Date;
  public status!: 'active' | 'inactive';

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserSession.init(
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
    deviceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    browser: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    operatingSystem: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    loginTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    lastActive: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    modelName: 'UserSession',
  }
);

// Set up association
UserSession.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(UserSession, { foreignKey: 'userId' });

export default UserSession; 