import { test, expect } from '@playwright/test';

test.describe('Hydra Checkout Flow E2E', () => {
  test('checkout page should load successfully', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/.*checkout/);
    const main = page.locator('main');
    await expect(main).toBeAttached();
  });

  test('cart page should load successfully', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/.*cart/);
  });

  test('should navigate from cart to checkout', async ({ page }) => {
    await page.goto('/cart');
    const checkoutLink = page
      .locator('a[href="/checkout"], button:has-text("Pagar"), button:has-text("Checkout")')
      .first();
    if ((await checkoutLink.count()) > 0) {
      await checkoutLink.click();
      await expect(page).toHaveURL(/.*checkout/);
    }
  });
});
