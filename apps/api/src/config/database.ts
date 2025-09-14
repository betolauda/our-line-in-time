import { Pool } from 'pg';
import { createClient } from 'redis';

// PostgreSQL connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Redis connection
export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

export const connectDatabases = async () => {
  try {
    // Test PostgreSQL connection
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');

    // Connect to Redis
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};