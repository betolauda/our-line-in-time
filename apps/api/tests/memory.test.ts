import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/database';

describe('Memory Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'memory-test@example.com',
        password: 'TestPassword123',
        name: 'Memory Test User',
        confirmPassword: 'TestPassword123',
      });

    authToken = userResponse.body.token;
    userId = userResponse.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM memory_family_members WHERE family_member_id = $1', [userId]);
    await pool.query('DELETE FROM media_items WHERE uploaded_by = $1', [userId]);
    await pool.query('DELETE FROM memories WHERE created_by = $1', [userId]);
    await pool.query('DELETE FROM family_members WHERE id = $1', [userId]);
    await pool.end();
  });

  describe('POST /api/memories', () => {
    it('should create a new memory successfully', async () => {
      const memoryData = {
        title: 'Test Memory',
        narrative: 'This is a test memory.',
        dateType: 'exact',
        startDate: '2024-01-01T00:00:00Z',
        location: { lat: 40.7128, lng: -74.0060 },
        locationName: 'New York City',
        privacyLevel: 'family',
        tags: ['test', 'memory'],
      };

      const response = await request(app)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(memoryData)
        .expect(201);

      expect(response.body).toHaveProperty('memory');
      expect(response.body.memory.title).toBe(memoryData.title);
      expect(response.body.memory.narrative).toBe(memoryData.narrative);
      expect(response.body.memory.createdBy).toBe(userId);
    });

    it('should reject memory creation without authentication', async () => {
      const memoryData = {
        title: 'Test Memory',
        narrative: 'This is a test memory.',
        dateType: 'exact',
        startDate: '2024-01-01T00:00:00Z',
        location: { lat: 40.7128, lng: -74.0060 },
        locationName: 'New York City',
        privacyLevel: 'family',
      };

      await request(app)
        .post('/api/memories')
        .send(memoryData)
        .expect(401);
    });

    it('should reject memory creation with invalid data', async () => {
      const invalidMemoryData = {
        title: '', // Empty title should be rejected
        dateType: 'invalid',
        location: { lat: 'invalid', lng: 'invalid' },
      };

      await request(app)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidMemoryData)
        .expect(400);
    });
  });

  describe('GET /api/memories', () => {
    it('should get user memories successfully', async () => {
      const response = await request(app)
        .get('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('memories');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.memories)).toBe(true);
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get('/api/memories')
        .expect(401);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/memories?limit=5&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.offset).toBe(0);
    });
  });

  describe('GET /api/memories/search/location', () => {
    it('should search memories by location', async () => {
      const response = await request(app)
        .get('/api/memories/search/location?lat=40.7128&lng=-74.0060&radius=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('memories');
      expect(response.body).toHaveProperty('searchParams');
      expect(response.body.searchParams.lat).toBe(40.7128);
      expect(response.body.searchParams.lng).toBe(-74.0060);
      expect(response.body.searchParams.radius).toBe(10);
    });

    it('should reject location search without coordinates', async () => {
      await request(app)
        .get('/api/memories/search/location')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});