import { test, expect } from '@playwright/test';

test.describe('Hydra Authentication E2E', () => {
  test('should allow navigation to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should allow navigation to signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/.*signup/);
  });

  test('should restrict access to protected routes without auth', async ({ page }) => {
    await page.goto('/profile/orders');
    await page.waitForURL(/login/).catch(() => {});
    const url = page.url();
    expect(url.includes('login') || url.includes('signup')).toBeTruthy();
  });

  test('should restrict access to profile root without auth', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForURL(/login/).catch(() => {});
    const url = page.url();
    expect(url.includes('login') || url.includes('signup')).toBeTruthy();
  });

  test('should restrict access to balance without auth', async ({ page }) => {
    await page.goto('/profile/balance');
    await page.waitForURL(/login/).catch(() => {});
    const url = page.url();
    expect(url.includes('login') || url.includes('signup')).toBeTruthy();
  });

  test('should restrict access to listings without auth', async ({ page }) => {
    await page.goto('/profile/listings');
    await page.waitForURL(/login/).catch(() => {});
    const url = page.url();
    expect(url.includes('login') || url.includes('signup')).toBeTruthy();
  });
});
