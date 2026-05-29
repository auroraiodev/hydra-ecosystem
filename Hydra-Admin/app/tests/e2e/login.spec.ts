import { test, expect } from '@playwright/test';

// Reset storageState to test unauthenticated login flows
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Admin Dashboard - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page with correct title', async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);
  });

  test('should display Hydra Admin branding', async ({ page }) => {
    const heading = page.locator('h1, h2, h3', { hasText: /Hydra.*Admin|Admin.*Hydra/i });
    await expect(heading).toBeVisible();
  });

  test('should have email input field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input#email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should have password input field', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"], input#password');
    await expect(passwordInput).toBeVisible();
  });

  test('should have submit button', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"], button:has-text("Iniciar Sesión")');
    await expect(submitButton).toBeVisible();
  });

  test('should have Google OAuth button', async ({ page }) => {
    const googleButton = page.locator('button:has-text("Google")');
    await expect(googleButton).toBeVisible();
  });

  test('should show error on failed login attempt', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input#email');
    const passwordInput = page.locator('input[type="password"], input#password');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill('wrong@example.com');
    await passwordInput.fill('wrongpassword');
    await submitButton.click();

    // The frontend displays errors using sonner toast or text error labels.
    // Let's assert an error message appears (e.g. "credentials", "failed", "incorrect")
    const errorEl = page.locator('text=/incorrecta|inválida|error|failed|invalid/i').first();
    await expect(errorEl).toBeVisible();
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input#email');
    const passwordInput = page.locator('input[type="password"], input#password');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill('admin@hydracollect.com');
    await passwordInput.fill('adminpassword');
    await submitButton.click();

    await page.waitForURL(/.*dashboard/, { waitUntil: 'domcontentloaded' });
    await expect(page.url()).toContain('dashboard');
  });

  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/login/, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('login');
  });

  test('should preserve redirect parameter', async ({ page }) => {
    await page.goto('/dashboard/orders');
    await page.waitForURL(/login/, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('redirect');
  });
});
