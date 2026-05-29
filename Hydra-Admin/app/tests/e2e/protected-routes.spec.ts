import { test, expect } from '@playwright/test';

// Reset storageState to ensure unauthenticated redirection is tested correctly
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Admin Dashboard - Protected Routes', () => {
  const protectedPaths = [
    '/dashboard',
    '/dashboard/analytics',
    '/dashboard/orders',
    '/dashboard/orders/some-id',
    '/dashboard/products',
    '/dashboard/products/add',
    '/dashboard/users',
    '/dashboard/categories',
    '/dashboard/tcgs',
    '/dashboard/banners',
    '/dashboard/tags',
    '/dashboard/wallet',
    '/dashboard/settings',
    '/profile',
  ];

  for (const path of protectedPaths) {
    test(`should redirect ${path} to login when unauthenticated`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/login/, { waitUntil: 'domcontentloaded' });
      expect(page.url()).toContain('login');
    });
  }
});
