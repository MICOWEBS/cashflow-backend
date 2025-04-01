import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Tag extends Model {
  public id!: string;
  public name!: string;
  public color!: string;
  public userId!: string;
}

Tag.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Tag',
  }
);

export default Tag; 