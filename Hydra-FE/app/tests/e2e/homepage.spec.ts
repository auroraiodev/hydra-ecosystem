import { test, expect } from '@playwright/test';

test.describe('Hydra Marketplace - Homepage', () => {
  test('should load the homepage with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Hydra|Magic|Collectables|MTG/i);
  });

  test('should have a visible main content area', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main#main-content')).toBeAttached();
  });

  test('should have skip-to-content link', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveText(/saltar al contenido principal/i);
  });

  test('should show the site navbar with logo and navigation', async ({ page }) => {
    await page.goto('/');
    const navbar = page.locator('nav[aria-label="Navegación principal"]');
    await expect(navbar).toBeVisible();
  });

  test('should have working site logo link to homepage', async ({ page }) => {
    await page.goto('/singles');
    const logoLink = page.locator('a[href="/"]').first();
    await logoLink.click();
    await expect(page).toHaveURL('/');
  });
});
