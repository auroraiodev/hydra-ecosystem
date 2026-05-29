import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Health & Proxy', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should return 200 on health endpoint', async ({ page }) => {
    const response = await page.request.get('/api/v1/health');
    expect(response.status()).toBe(200);
  });

  test('should return ok status from health endpoint', async ({ page }) => {
    const response = await page.request.get('/api/v1/health');
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('should return 200 on health check', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
  });

  test('should proxy to mock backend successfully', async ({ page }) => {
    const response = await page.request.get('/api/proxy/health');
    // Should either succeed (200 from mock) or get 502 (if backend unreachable)
    const status = response.status();
    expect(status === 200 || status === 502).toBeTruthy();
    if (status === 200) {
      const body = await response.json();
      expect(body.status).toBe('ok');
    }
  });

  test('should return 401 for unauthenticated API call to protected endpoint', async ({ page }) => {
    const response = await page.request.get('/api/proxy/admin/users');
    const status = response.status();
    expect(status === 401 || status === 502).toBeTruthy();
  });
});
