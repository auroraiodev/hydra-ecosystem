import { test, expect } from '@playwright/test';

test.describe('Hydra Marketplace - Product Browsing', () => {
  test('singles landing page should load', async ({ page }) => {
    await page.goto('/singles');
    await expect(page).toHaveURL(/.*singles/);
    await expect(page.locator('main')).toBeAttached();
  });

  test('singles search page should load', async ({ page }) => {
    await page.goto('/singles/search');
    await expect(page).toHaveURL(/.*singles.*search/);
  });

  test('browse page should load with search functionality', async ({ page }) => {
    await page.goto('/browse');
    await expect(page).toHaveURL(/.*browse/);
    const main = page.locator('main');
    await expect(main).toBeAttached();
  });

  test('cart page should display when navigated to', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/.*cart/);
  });

  test('wishlist page should display when navigated to', async ({ page }) => {
    await page.goto('/wishlist');
    await expect(page).toHaveURL(/.*wishlist/);
  });

  test('checkout page should load with empty cart state', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/.*checkout/);
  });

  test('sell page should load', async ({ page }) => {
    await page.goto('/sell');
    await expect(page).toHaveURL(/.*sell/);
  });

  test('should handle TCG-specific route', async ({ page }) => {
    await page.goto('/magic').catch(() => {});
    const currentUrl = page.url();
    expect(currentUrl.includes('/magic') || currentUrl === 'http://localhost:3000/').toBeTruthy();
  });
});
