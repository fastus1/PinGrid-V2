const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'pingrid',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
  min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
  maxUses: parseInt(process.env.DB_POOL_MAX_USES, 10) || 7500,
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT, 10) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT, 10) || 5000,
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT, 10) || 30000,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err.message);
});

module.exports = pool;
