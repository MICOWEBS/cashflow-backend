import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { setupRoutes } from './routes/index';
import { setupDatabase } from './config/database';
import { errorHandler } from './middlewares/errorHandler';
import { limiter } from './middlewares/rateLimiter';
import logger from './utils/logger';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './middlewares/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(compression());

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Static Files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Setup Routes
setupRoutes(app);

// Apply rate limiter after routes setup
app.use(limiter);

// Error Handler
app.use(((err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
}) as unknown as express.ErrorRequestHandler);

// Database Connection
setupDatabase()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(error);
  process.exit(1);
}); 