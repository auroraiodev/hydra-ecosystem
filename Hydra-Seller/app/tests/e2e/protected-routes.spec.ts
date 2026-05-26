import { test, expect } from '@playwright/test';

test.describe('Seller Dashboard - Protected Routes', () => {
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
    '/dashboard/wallet',
    '/dashboard/profile',
    '/dashboard/imports',
    '/dashboard/historial',
    '/dashboard/feature-flags',
    '/dashboard/carts',
    '/dashboard/sales',
    '/dashboard/tags',
    '/profile',
  ];

  for (const path of protectedPaths) {
    test(`should redirect ${path} to login when unauthenticated`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/login/);
      expect(page.url()).toContain('login');
    });
  }
});
