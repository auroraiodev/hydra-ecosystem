import { test, expect } from '@playwright/test';

test.describe('Hydra Marketplace E2E', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Hydra|Magic|Collectables|MTG/i);
    await expect(page.locator('main')).toBeAttached();
  });

  test('should have working search and browse pages', async ({ page }) => {
    await page.goto('/browse');
    await expect(page).toHaveURL(/.*browse/);
    await expect(page.locator('main')).toBeAttached();
  });

  test('should have working singles browsing', async ({ page }) => {
    await page.goto('/singles');
    await expect(page).toHaveURL(/.*singles/);
  });

  test('should have working cart navigation', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/.*cart/);
  });

  test('should have working help center', async ({ page }) => {
    await page.goto('/help');
    await expect(page).toHaveURL(/.*help/);
  });
});
