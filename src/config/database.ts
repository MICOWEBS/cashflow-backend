import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'cashflow',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export const setupDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // In production, we want to be more careful with database changes
    if (process.env.NODE_ENV === 'production') {
      await sequelize.sync(); // This will only create tables if they don't exist
      console.log('Database synchronized (production mode).');
    } else {
      await sequelize.sync({ alter: true }); // Development mode - allows schema changes
      console.log('Database synchronized (development mode).');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    // In production, we want to exit if we can't connect to the database
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default sequelize; 