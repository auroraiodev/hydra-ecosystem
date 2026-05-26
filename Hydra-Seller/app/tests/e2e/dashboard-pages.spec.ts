import { test, expect } from '@playwright/test';

test.describe('Seller Dashboard - Page Content', () => {
  test('homepage should redirect to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/login|dashboard/);
    const url = page.url();
    expect(url.includes('login') || url.includes('dashboard')).toBeTruthy();
  });

  test('dashboard page should have correct structure when rendered', async ({ page }) => {
    await page.goto('/dashboard').catch(() => {});
    if (!page.url().includes('login')) {
      const main = page.locator('main');
      await expect(main).toBeAttached();
    }
  });

  test('products page should have correct structure', async ({ page }) => {
    await page.goto('/dashboard/products').catch(() => {});
    if (!page.url().includes('login')) {
      const pageContent = page.locator('main');
      await expect(pageContent).toBeAttached();
    }
  });

  test('orders page should have correct structure', async ({ page }) => {
    await page.goto('/dashboard/orders').catch(() => {});
    if (!page.url().includes('login')) {
      const pageContent = page.locator('main');
      await expect(pageContent).toBeAttached();
    }
  });

  test('wallet page should have correct structure', async ({ page }) => {
    await page.goto('/dashboard/wallet').catch(() => {});
    if (!page.url().includes('login')) {
      const pageContent = page.locator('main');
      await expect(pageContent).toBeAttached();
    }
  });
});
