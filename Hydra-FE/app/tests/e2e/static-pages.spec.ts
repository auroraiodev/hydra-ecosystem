import { test, expect } from '@playwright/test';

test.describe('Hydra Marketplace - Static Pages', () => {
  test('authenticity page should load with hero heading', async ({ page }) => {
    await page.goto('/authenticity');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('terms page should load', async ({ page }) => {
    await page.goto('/terms');
    await expect(page).toHaveURL(/.*terms/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('privacy page should load', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveURL(/.*privacy/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('cookies page should load', async ({ page }) => {
    await page.goto('/cookies');
    await expect(page).toHaveURL(/.*cookies/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('returns page should load', async ({ page }) => {
    await page.goto('/returns');
    await expect(page).toHaveURL(/.*returns/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('help page should load', async ({ page }) => {
    await page.goto('/help');
    await expect(page).toHaveURL(/.*help/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('404 page should work for unknown routes', async ({ page }) => {
    const _response = await page.goto('/this-route-does-not-exist');
    await expect(page.locator('h1').or(page.locator('main'))).toBeAttached();
  });
});
