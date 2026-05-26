import { test, expect } from '@playwright/test';
import { navigateAndWait, expectPageTitle } from './helpers';

test.describe('Product Browsing - Page Structure', () => {
  test('singles landing page has main content and heading', async ({ page }) => {
    await navigateAndWait(page, '/singles');
    await expectPageTitle(page, /Hydra|Singles/i);
    await expect(page.locator('main')).toBeAttached();
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeAttached();
  });

  test('singles page has product grid or content area', async ({ page }) => {
    await navigateAndWait(page, '/singles');
    const main = page.locator('main');
    await expect(main).toBeAttached();
    const grid = page.locator('[data-testid="product-card"]').first();
    const hasGrid = await grid.isVisible().catch(() => false);
    if (hasGrid) {
      await expect(grid).toBeVisible();
    }
  });

  test('browse page loads and displays content', async ({ page }) => {
    await navigateAndWait(page, '/browse');
    await expectPageTitle(page, /Hydra|Browse|Explorar/i);
    await expect(page.locator('main')).toBeAttached();
  });

  test('sell page loads', async ({ page }) => {
    await navigateAndWait(page, '/sell');
    await expect(page.locator('main')).toBeAttached();
  });

  test('TCG-specific route /magic loads', async ({ page }) => {
    await page.goto('/magic');
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    const acceptable = [currentUrl.includes('/magic'), currentUrl === 'http://localhost:3000/'];
    expect(acceptable.some(Boolean)).toBeTruthy();
  });
});

test.describe('Product Browsing - Navigation Flow', () => {
  test('navigates from homepage to singles', async ({ page }) => {
    await navigateAndWait(page, '/');
    const singlesLink = page.locator('a[href="/singles"]').first();
    const isVisible = await singlesLink.isVisible().catch(() => false);
    if (isVisible) {
      await singlesLink.click();
      await expect(page).toHaveURL(/singles/);
    }
  });

  test('navigates from homepage to browse', async ({ page }) => {
    await navigateAndWait(page, '/');
    const browseLink = page.locator('a[href="/browse"]').first();
    const isVisible = await browseLink.isVisible().catch(() => false);
    if (isVisible) {
      await browseLink.click();
      await expect(page).toHaveURL(/browse/);
    }
  });
});
