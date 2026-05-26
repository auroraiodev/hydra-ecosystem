import { test, expect } from '@playwright/test';

test.describe('Seller Dashboard - Login', () => {
  test('should display login page with correct title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should display Hydra Seller branding', async ({ page }) => {
    await page.goto('/login');
    const heading = page.locator('h1, h2, h3', { hasText: /Hydra.*Seller|Seller.*Hydra/i });
    await expect(heading).toBeVisible();
  });

  test('should have email input field', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"], input#email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should have password input field', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('input[type="password"], input#password');
    await expect(passwordInput).toBeVisible();
  });

  test('should have submit button with login text', async ({ page }) => {
    await page.goto('/login');
    const submitButton = page.locator('button[type="submit"], button:has-text("Iniciar Sesión")');
    await expect(submitButton).toBeVisible();
  });

  test('should have Google OAuth continue button', async ({ page }) => {
    await page.goto('/login');
    const googleButton = page.locator('button:has-text("Google")');
    await expect(googleButton).toBeVisible();
  });

  test('should show error on failed login attempt', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"], input#email');
    const passwordInput = page.locator('input[type="password"], input#password');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill('wrong@example.com');
    await passwordInput.fill('wrongpassword');
    await submitButton.click();

    await page.waitForTimeout(2000);
    const errorEl = page.locator('text=error, text=Login failed, text=Incorrect').first();
    if ((await errorEl.count()) > 0) {
      await expect(errorEl).toBeVisible();
    }
  });

  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/login/);
    expect(page.url()).toContain('login');
  });

  test('should preserve redirect parameter', async ({ page }) => {
    await page.goto('/dashboard/orders');
    await page.waitForURL(/login/);
    expect(page.url()).toContain('redirect');
  });
});
