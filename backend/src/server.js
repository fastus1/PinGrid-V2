const app = require('./app');
const pool = require('./shared/config/database');
const redisClient = require('./shared/config/redis');

const PORT = process.env.PORT || 5000;

// Test database connection on startup
async function testConnections() {
  try {
    // Test PostgreSQL
    const result = await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection successful:', result.rows[0].now);
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.error('⚠️  Continuing anyway - check your database credentials in .env');
    console.error('    DB_HOST:', process.env.DB_HOST || 'localhost');
    console.error('    DB_PORT:', process.env.DB_PORT || '5432');
    console.error('    DB_NAME:', process.env.DB_NAME || 'pingrid');
    console.error('    DB_USER:', process.env.DB_USER || 'postgres');
  }

  // Redis connection is tested in redis.js (on 'connect' event)
  console.log('✅ Server starting (check connection statuses above)');
}

// Start server
async function startServer() {
  await testConnections();

  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🚀 ========================================');
    console.log(`🚀 PinGrid V2.0 Backend Server Started`);
    console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Server running on: http://0.0.0.0:${PORT}`);
    console.log(`🚀 Health check: http://0.0.0.0:${PORT}/health`);
    console.log('🚀 ========================================');
    console.log('');
  });
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received, closing connections...');
  await pool.end();
  await redisClient.quit();
  process.exit(0);
});

// Start the server
startServer();
