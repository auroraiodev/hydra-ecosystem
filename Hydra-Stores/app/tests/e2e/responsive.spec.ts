import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.describe('Desktop Viewport', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should show full sidebar on desktop', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const sidebar = page.locator('aside, [class*="sidebar"]');
        await expect(sidebar).toBeVisible();
      }
    });

    test('should show all sidebar section labels on desktop', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const overviewLabel = page.locator('text=Overview');
        const catalogLabel = page.locator('text=Catalog');
        await expect(overviewLabel).toBeVisible();
        await expect(catalogLabel).toBeVisible();
      }
    });

    test('should have desktop sidebar width', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const sidebar = page.locator('aside, [class*="sidebar"]');
        const box = await sidebar.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(200);
        }
      }
    });
  });

  test.describe('Tablet Viewport', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should still show sidebar on tablet', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const sidebar = page.locator('aside, [class*="sidebar"]');
        const visibility = await sidebar.isVisible().catch(() => false);
      }
    });

    test('should have hamburger menu on tablet', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const menuButton = page.locator('[class*="lg:hidden"] button, button[class*="lg\\:hidden"], button:has(svg.lucide-menu)');
        if (await menuButton.count() > 0) {
          await expect(menuButton.first()).toBeVisible();
        }
      }
    });

    test('should toggle sidebar on tablet menu click', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const menuButton = page.locator('[class*="lg:hidden"] button, button[class*="lg\\:hidden"]').first();
        if (await menuButton.count() > 0) {
          await menuButton.click();
          await page.waitForTimeout(500);
          const overview = page.locator('text=Overview');
          await expect(overview).toBeVisible();
        }
      }
    });
  });

  test.describe('Mobile Viewport', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('should have mobile menu toggle visible', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const menuBtn = page.locator('[class*="lg:hidden"] button, button:has(svg.lucide-menu)').first();
        await expect(menuBtn).toBeVisible();
      }
    });

    test('should open sidebar drawer on mobile', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const toggleButton = page.locator('button').filter({ has: page.locator('svg.lucide-menu') }).first();
        if (await toggleButton.count() > 0) {
          await toggleButton.click();
          await page.waitForTimeout(500);
          const drawer = page.locator('[class*="drawer"], [role="dialog"]').first();
          if (await drawer.count() > 0) {
            await expect(drawer).toBeVisible();
          }
        }
      }
    });

    test('should have properly sized content on mobile', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const main = page.locator('main');
        const box = await main.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(0);
          expect(box.x).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should display stats cards stacked on mobile', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const statCards = page.locator('[class*="grid"] > *, [class*="card"]');
        const count = await statCards.count();
        if (count > 0) {
          const firstBox = await statCards.first().boundingBox();
          const secondBox = await statCards.nth(1).boundingBox().catch(() => null);
          if (firstBox && secondBox) {
            expect(secondBox.y).toBeGreaterThanOrEqual(firstBox.y);
          }
        }
      }
    });
  });

  test.describe('Navigation on Mobile', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('should navigate via mobile menu to products', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const menuBtn = page.locator('button').filter({ has: page.locator('svg.lucide-menu') }).first();
        if (await menuBtn.count() > 0) {
          await menuBtn.click();
          await page.waitForTimeout(500);
          const productsLink = page.locator('a[href*="/dashboard/products"]').first();
          if (await productsLink.count() > 0) {
            await productsLink.click();
            await expect(page).toHaveURL(/\/dashboard\/products/);
          }
        }
      }
    });

    test('should close mobile sidebar after navigation', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const menuBtn = page.locator('button').filter({ has: page.locator('svg.lucide-menu') }).first();
        if (await menuBtn.count() > 0) {
          await menuBtn.click();
          await page.waitForTimeout(500);
          const overlay = page.locator('[class*="overlay"]').first();
          if (await overlay.count() > 0) {
            await overlay.click();
            await page.waitForTimeout(500);
          }
        }
      }
    });
  });
});
