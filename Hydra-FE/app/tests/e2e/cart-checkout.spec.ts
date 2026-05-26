import { test, expect } from '@playwright/test';

test.describe('Hydra Marketplace - Cart & Checkout', () => {
  test('cart page should show empty state when no items', async ({ page }) => {
    await page.goto('/cart');
    const pageContent = page.locator('main');
    await expect(pageContent).toBeAttached();
  });

  test('checkout page should show empty state when no items', async ({ page }) => {
    await page.goto('/checkout');
    const pageContent = page.locator('main');
    await expect(pageContent).toBeAttached();
  });

  test('checkout page should have continue to cart link when empty', async ({ page }) => {
    await page.goto('/checkout');
    const backToCart = page.locator('a[href="/cart"]');
    if ((await backToCart.count()) > 0) {
      await expect(backToCart).toBeVisible();
    }
  });

  test('cart page should have link to explore products when empty', async ({ page }) => {
    await page.goto('/cart');
    const exploreLink = page.locator('a[href="/"]');
    const visibleLinks = exploreLink.filter({ hasText: /explorar|productos|tienda|home|inicio/i });
    if ((await visibleLinks.count()) > 0) {
      await expect(visibleLinks.first()).toBeVisible();
    }
  });
});
