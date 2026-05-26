import { test, expect } from '@playwright/test';

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
    '/dashboard/profile',
    '/dashboard/imports',
    '/dashboard/inventario',
    '/dashboard/historial',
    '/dashboard/feature-flags',
    '/dashboard/chat',
    '/dashboard/carts',
    '/dashboard/sales',
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
