// This is a simple fallback server for when the main server has database connection issues
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { exec } = require('child_process');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://cashflowfinance.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Root route - provides basic info
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Cashflow API Diagnostic Mode',
    status: 'Fallback server running - Database connection issue detected',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Environment variables route (filtered for security)
app.get('/env', (req, res) => {
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    FRONTEND_URL: process.env.FRONTEND_URL,
    // We filter out sensitive information like passwords and secrets
  };
  
  res.status(200).json({
    message: 'Environment Variables',
    env: safeEnv
  });
});

// Database connection test
app.get('/test-db', (req, res) => {
  const pg = require('pg');
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  client.connect()
    .then(() => {
      res.status(200).json({
        message: 'Database connection successful via pg client',
        connectionString: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@') // Hide password
      });
      client.end();
    })
    .catch(err => {
      res.status(500).json({
        message: 'Database connection failed via pg client',
        error: err.message,
        connectionString: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@') // Hide password
      });
    });
});

// Network diagnostic
app.get('/network', (req, res) => {
  const host = process.env.DB_HOST || 'dpg-cvlvohe3jp1c738rbo2g-a';
  
  exec(`ping -c 3 ${host}`, (error, stdout, stderr) => {
    res.status(200).json({
      message: 'Network Diagnostic',
      host,
      pingResult: stdout || stderr,
      error: error ? error.message : null
    });
  });
});

// Start the fallback server
app.listen(PORT, () => {
  console.log(`Fallback server is running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
}); 