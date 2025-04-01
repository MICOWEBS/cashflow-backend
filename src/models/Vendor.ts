import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Tag from './Tag';

class Vendor extends Model {
  public id!: number;
  public userId!: string;
  public name!: string;
  public companyName?: string;
  public email?: string;
  public phone?: string;
  public address?: string;
  public notes?: string;
  public tags?: Tag[];
  public setTags!: (tags: string[]) => Promise<void>;
}

Vendor.init(
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
    modelName: 'Vendor',
    timestamps: true,
  }
);

Vendor.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Vendor, { foreignKey: 'userId' });

// Define many-to-many relationship with tags
Vendor.belongsToMany(Tag, {
  through: 'VendorTags',
  as: 'tags',
});

Tag.belongsToMany(Vendor, {
  through: 'VendorTags',
  as: 'vendors',
});

export default Vendor; 