const redis = require('redis');
require('dotenv').config();

// Create Redis client but don't auto-connect (will connect when needed)
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisClient.on('error', (err) => {
  // Silently ignore Redis errors for now (not critical for auth)
  if (process.env.NODE_ENV === 'development') {
    console.error('⚠️  Redis not available (not critical for MVP)');
  }
});

// DON'T auto-connect - Redis is optional for MVP
// redisClient.connect().catch(console.error);

// Export a mock client that won't crash if Redis is unavailable
const mockClient = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1,
  quit: async () => 'OK',
  ...redisClient
};

module.exports = mockClient;
