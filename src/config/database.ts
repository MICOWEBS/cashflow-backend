import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Check if we have a DATABASE_URL (common in deployment environments)
const databaseUrl = process.env.DATABASE_URL;

let sequelize: Sequelize;

if (databaseUrl) {
  // Use the database URL provided by the environment
  sequelize = new Sequelize(databaseUrl, {
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
  });
} else {
  // Fall back to individual credentials if no DATABASE_URL is provided
  sequelize = new Sequelize(
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
}

export const setupDatabase = async () => {
  try {
    // Try to connect to the database
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
      console.error('Database connection failed in production, attempting to continue...');
      // We don't exit immediately to allow for troubleshooting
      // process.exit(1);
    }
  }
};

export default sequelize; 