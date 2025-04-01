import dotenv from 'dotenv';

dotenv.config();

export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cashflow',
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    provider: {
      resend: {
        apiKey: process.env.RESEND_API_KEY
      }
    }
  },
  clientUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
}; 