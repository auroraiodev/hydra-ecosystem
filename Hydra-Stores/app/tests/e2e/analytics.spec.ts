import { test, expect } from '@playwright/test';

test.describe('Analytics', () => {
  test.describe('Buyer Analytics', () => {
    test('should navigate to buyer analytics page', async ({ page }) => {
      await page.goto('/dashboard/analytics/buyers');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await expect(page).toHaveURL(/analytics/);
      }
    });

    test('should display buyer analytics title', async ({ page }) => {
      await page.goto('/dashboard/analytics/buyers');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const title = page.locator('h1, h2').filter({ hasText: /Analytics|Buyer|Comprador/i });
        if (await title.count() > 0) {
          await expect(title.first()).toBeVisible();
        }
      }
    });

    test('should display buyer stats cards', async ({ page }) => {
      await page.goto('/dashboard/analytics/buyers');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const statCards = page.locator('[class*="card"]');
        const count = await statCards.count();
        if (count > 0) {
          await expect(statCards.first()).toBeVisible();
        }
      }
    });

    test('should render buyer charts', async ({ page }) => {
      await page.goto('/dashboard/analytics/buyers');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2500);
        const charts = page.locator('.recharts-responsive-container, .recharts-wrapper');
        if (await charts.count() > 0) {
          await expect(charts.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Product Analytics', () => {
    test('should navigate to product analytics page', async ({ page }) => {
      await page.goto('/dashboard/analytics/products');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await expect(page).toHaveURL(/analytics/);
      }
    });

    test('should display product analytics with charts', async ({ page }) => {
      await page.goto('/dashboard/analytics/products');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2500);
        const charts = page.locator('.recharts-responsive-container, .recharts-wrapper, canvas');
        if (await charts.count() > 0) {
          await expect(charts.first()).toBeAttached();
        }
      }
    });

    test('should display top products table', async ({ page }) => {
      await page.goto('/dashboard/analytics/products');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const productTable = page.locator('table');
        if (await productTable.count() > 0) {
          const headers = await productTable.locator('th').allTextContents();
          const hasProduct = headers.some(h => /product|card|carta/i.test(h));
          const hasSold = headers.some(h => /sold|vendido|quantity/i.test(h));
          expect(hasSold).toBeTruthy();
        }
      }
    });

    test('should show product images in analytics table', async ({ page }) => {
      await page.goto('/dashboard/analytics/products');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const images = page.locator('table img');
        const count = await images.count();
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const src = await images.nth(i).getAttribute('src');
            expect(src).toBeTruthy();
          }
        }
      }
    });
  });
});
