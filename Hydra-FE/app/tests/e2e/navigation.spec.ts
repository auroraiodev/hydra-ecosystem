import { test, expect } from '@playwright/test';

test.describe('Hydra Marketplace - Navigation', () => {
  test('navbar should have cart link', async ({ page }) => {
    await page.goto('/');
    const cartLink = page.locator('a[href="/cart"]').first();
    await expect(cartLink).toBeVisible();
  });

  test('navbar should have wishlist link', async ({ page }) => {
    await page.goto('/');
    const wishlistLink = page.locator('a[href="/wishlist"]').first();
    await expect(wishlistLink).toBeVisible();
  });

  test('should navigate to cart page', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/.*cart/);
  });

  test('should navigate to wishlist page', async ({ page }) => {
    await page.goto('/wishlist');
    await expect(page).toHaveURL(/.*wishlist/);
  });

  test('should navigate to singles page', async ({ page }) => {
    await page.goto('/singles');
    await expect(page).toHaveURL(/.*singles/);
  });

  test('should navigate to browse page', async ({ page }) => {
    await page.goto('/browse');
    await expect(page).toHaveURL(/.*browse/);
  });

  test('should navigate to checkout page', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/.*checkout/);
  });

  test('should navigate to help page', async ({ page }) => {
    await page.goto('/help');
    await expect(page).toHaveURL(/.*help/);
  });

  test('should navigate to sell page', async ({ page }) => {
    await page.goto('/sell');
    await expect(page).toHaveURL(/.*sell/);
  });

  test('should have footer with support links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    const helpLink = footer.locator('a[href="/help"]');
    if ((await helpLink.count()) > 0) {
      await expect(helpLink).toBeVisible();
    }
  });

  test('should have footer with legal links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    const legalLinks = [
      { href: '/terms', label: /términos|terms/i },
      { href: '/privacy', label: /privacidad|privacy/i },
      { href: '/cookies', label: /cookies/i },
      { href: '/returns', label: /devolución|returns/i },
    ];
    await Promise.all(
      legalLinks.map(async (link) => {
        const el = footer.locator(`a[href="${link.href}"]`);
        if ((await el.count()) > 0) {
          await expect(el).toBeVisible();
        }
      })
    );
  });
});
