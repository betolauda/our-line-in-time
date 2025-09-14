// Jest setup file for API tests
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/our_line_in_time_test';

// Extend Jest matchers
expect.extend({
  toHaveProperty: (received, property) => {
    const pass = received && typeof received === 'object' && property in received;
    return {
      message: () => `expected ${received} to have property ${property}`,
      pass,
    };
  },
});

// Global test timeout
jest.setTimeout(30000);