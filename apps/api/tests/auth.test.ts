import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/database';

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Setup test database
    await pool.query('DELETE FROM family_members WHERE email LIKE %test%');
  });

  afterAll(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM family_members WHERE email LIKE %test%');
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123',
        name: 'Test User',
        confirmPassword: 'TestPassword123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123',
        name: 'Test User',
        confirmPassword: 'TestPassword123',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: '123',
        name: 'Test User',
        confirmPassword: '123',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should reject registration with mismatched passwords', async () => {
      const userData = {
        email: 'test3@example.com',
        password: 'TestPassword123',
        name: 'Test User',
        confirmPassword: 'DifferentPassword123',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser: any;

    beforeAll(async () => {
      // Create a test user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123',
          name: 'Login Test User',
          confirmPassword: 'TestPassword123',
        });
      testUser = response.body.user;
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('login-test@example.com');
    });

    it('should reject login with invalid email', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123',
        })
        .expect(401);
    });

    it('should reject login with invalid password', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get auth token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123',
        });
      authToken = response.body.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('login-test@example.com');
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});