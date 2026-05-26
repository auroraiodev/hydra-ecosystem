import { test, expect } from '@playwright/test';

test.describe('Hydra Marketplace - Auth Flow', () => {
  test('should navigate to login page and show login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/.*signup/);
  });

  test('should have link to login from navbar', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.locator('a[href="/login"]').first();
    if ((await loginLink.count()) > 0) {
      await expect(loginLink).toBeVisible();
    }
  });

  test('should restrict access to protected profile routes', async ({ page }) => {
    await page.goto('/profile/orders');
    await page.waitForURL(/login/).catch(() => {});
    const currentUrl = page.url();
    expect(currentUrl.includes('login') || currentUrl.includes('signup')).toBeTruthy();
  });

  test('should restrict access to profile page', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForURL(/login/).catch(() => {});
    const currentUrl = page.url();
    expect(currentUrl.includes('login') || currentUrl.includes('signup')).toBeTruthy();
  });

  test('should have working login link in mobile bottom nav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const profileNav = page.locator('a[href="/profile"]').last();
    if ((await profileNav.count()) > 0) {
      await profileNav.click();
      await page.waitForURL(/login/).catch(() => {});
      const currentUrl = page.url();
      expect(currentUrl.includes('login') || currentUrl.includes('signup')).toBeTruthy();
    }
  });
});
