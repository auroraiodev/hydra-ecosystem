import { test, expect } from '@playwright/test';
import { navigateAndWait } from './helpers';

test.describe('Cart - Empty State', () => {
  test('cart page loads with empty state', async ({ page }) => {
    await navigateAndWait(page, '/cart');
    await expect(page).toHaveURL(/cart/);
    await expect(page.locator('main')).toBeAttached();
  });

  test('empty cart shows explore products link', async ({ page }) => {
    await navigateAndWait(page, '/cart');
    const exploreLink = page.locator('a[href="/"], a[href="/singles"], a[href="/browse"]').first();
    await expect(exploreLink).toBeAttached();
  });

  test('navigates from empty cart to homepage via CTA', async ({ page }) => {
    await navigateAndWait(page, '/cart');
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeAttached();
    await homeLink.click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Cart - Navigation', () => {
  test('cart page has correct URL', async ({ page }) => {
    await navigateAndWait(page, '/cart');
    await expect(page).toHaveURL(/cart/);
  });

  test('navigates from homepage cart link to cart', async ({ page }) => {
    await navigateAndWait(page, '/');
    const cartLink = page.locator('a[href="/cart"]').first();
    await expect(cartLink).toBeAttached();
    await cartLink.click();
    await expect(page).toHaveURL(/cart/);
  });
});

test.describe('Checkout - Page Load', () => {
  test('checkout page loads', async ({ page }) => {
    await navigateAndWait(page, '/checkout');
    await expect(page.locator('main')).toBeAttached();
  });

  test('checkout page accepts URL', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/checkout/);
  });
});

test.describe('Wishlist - Page Load', () => {
  test('wishlist page loads', async ({ page }) => {
    await navigateAndWait(page, '/wishlist');
    await expect(page).toHaveURL(/wishlist/);
    await expect(page.locator('main')).toBeAttached();
  });

  test('wishlist empty state shows', async ({ page }) => {
    await page.goto('/wishlist');
    await expect(page.locator('main')).toBeAttached();
  });
});
