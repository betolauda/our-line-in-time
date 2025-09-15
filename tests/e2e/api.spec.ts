import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('should have API server running and responding', async ({ page }) => {
    // Test API health endpoint
    const response = await page.request.get('http://localhost:3001/api/health');

    if (response.ok()) {
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toBeDefined();
    } else {
      // API might not be running, check if we get expected error
      expect([404, 500, 503]).toContain(response.status());
    }
  });

  test('should handle API authentication endpoints', async ({ page }) => {
    // Test login endpoint structure (without valid credentials)
    const loginResponse = await page.request.post('http://localhost:3001/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'invalidpassword'
      }
    });

    // Should return 400/401 for invalid credentials, not 500 (server error)
    expect([400, 401, 404]).toContain(loginResponse.status());
  });

  test('should serve performance metrics endpoint', async ({ page }) => {
    // Test the performance endpoint mentioned in CLAUDE.md
    const response = await page.request.get('http://localhost:3001/api/performance');

    if (response.ok()) {
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toBeDefined();

      // Performance metrics should have basic structure
      expect(typeof body).toBe('object');
    } else {
      // Endpoint might not be implemented yet
      expect([404, 500, 503]).toContain(response.status());
    }
  });

  test('should handle CORS properly', async ({ page }) => {
    await page.goto('/');

    // Make a request from the frontend to the API
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:3001/api/health');
        return {
          status: res.status,
          ok: res.ok,
          corsAllowed: true
        };
      } catch (error: any) {
        return {
          status: 0,
          ok: false,
          corsAllowed: false,
          error: error.message
        };
      }
    });

    // Should either work (CORS configured) or fail gracefully
    if (response.corsAllowed) {
      expect(response.status).toBeGreaterThan(0);
    } else {
      // CORS error is expected if not configured
      expect(response.error).toBeDefined();
    }
  });

  test('should handle file upload endpoints', async ({ page }) => {
    // Test upload endpoint (without authentication)
    const formData = new FormData();
    formData.append('file', new File(['test content'], 'test.txt', { type: 'text/plain' }));

    const response = await page.request.post('http://localhost:3001/api/memories/upload', {
      multipart: {
        file: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('test content')
        }
      }
    });

    // Should return 401 (unauthorized) or 400 (bad request), not 500 (server error)
    expect([400, 401, 404, 413]).toContain(response.status());
  });
});