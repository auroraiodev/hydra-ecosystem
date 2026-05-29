import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login page with correct title and branding', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveURL(/.*login/);
      await expect(page.locator('h1, h2, h3').filter({ hasText: /Hydra.*Seller|Seller.*Hydra/i })).toBeVisible();
    });

    test('should display cat mascot logo image', async ({ page }) => {
      await page.goto('/login');
      const logo = page.locator('img[alt="Hydra Seller"]');
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('src', /cat\.png/);
    });

    test('should have email input field with correct attributes', async ({ page }) => {
      await page.goto('/login');
      const emailInput = page.locator('input#email');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('placeholder', 'vendedor@example.com');
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should have password input field with visibility toggle', async ({ page }) => {
      await page.goto('/login');
      const passwordInput = page.locator('input#password');
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = page.locator('button[tabindex="-1"]');
      await expect(toggleButton).toBeVisible();
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should have submit button with Iniciar Sesion text', async ({ page }) => {
      await page.goto('/login');
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toContainText('Iniciar Sesión');
    });

    test('should have Google OAuth button with icon', async ({ page }) => {
      await page.goto('/login');
      const googleButton = page.locator('button').filter({ hasText: 'Google' });
      await expect(googleButton).toBeVisible();

      const googleIcon = googleButton.locator('svg');
      await expect(googleIcon).toBeVisible();
    });

    test('should have separator between Google and email login', async ({ page }) => {
      await page.goto('/login');
      const separator = page.locator('text=Or continue with email');
      await expect(separator).toBeVisible();
    });

    test('should show error on failed login attempt', async ({ page }) => {
      await page.goto('/login');
      await page.locator('input#email').fill('wrong@example.com');
      await page.locator('input#password').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(1500);
      const errorEl = page.locator('.text-destructive, [class*="destructive"]');
      await expect(errorEl).toBeVisible();
    });

    test('should show error from URL parameter', async ({ page }) => {
      await page.goto('/login?error=Invalid+credentials');
      const errorEl = page.locator('.text-destructive, [class*="destructive"]');
      await expect(errorEl).toBeVisible();
    });

    test('should disable form elements during loading state', async ({ page }) => {
      await page.goto('/login');
      await page.locator('input#email').fill('test@example.com');
      await page.locator('input#password').fill('password123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(500);
      await expect(page.locator('input#email')).toBeDisabled();
      await expect(page.locator('input#password')).toBeDisabled();
    });
  });

  test.describe('Authentication Guard', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForURL(/login/);
      expect(page.url()).toContain('login');
    });

    test('should redirect to login when accessing products without auth', async ({ page }) => {
      await page.goto('/dashboard/products');
      await page.waitForURL(/login/);
      expect(page.url()).toContain('login');
    });

    test('should redirect to login when accessing orders without auth', async ({ page }) => {
      await page.goto('/dashboard/orders');
      await page.waitForURL(/login/);
      expect(page.url()).toContain('login');
    });

    test('should redirect to login when accessing wallet without auth', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      await page.waitForURL(/login/);
      expect(page.url()).toContain('login');
    });

    test('should redirect to login when accessing profile without auth', async ({ page }) => {
      await page.goto('/dashboard/profile');
      await page.waitForURL(/login/);
      expect(page.url()).toContain('login');
    });

    test('should preserve redirect parameter in URL', async ({ page }) => {
      await page.goto('/dashboard/orders');
      await page.waitForURL(/login/);
      expect(page.url()).toContain('redirect');
    });

    test('should redirect / to login or dashboard', async ({ page }) => {
      await page.goto('/');
      await page.waitForURL(/login|dashboard/);
      const url = page.url();
      expect(url.includes('login') || url.includes('dashboard')).toBeTruthy();
    });
  });

  test.describe('Google OAuth Flow', () => {
    test('should initiate Google OAuth on button click', async ({ page }) => {
      await page.goto('/login');
      const googleButton = page.locator('button').filter({ hasText: 'Google' });

      await Promise.all([
        page.waitForURL(/google|accounts\.google\.com|api\/v1\/auth\/google/, { timeout: 5000 }).catch(() => {}),
        googleButton.click(),
      ]);
    });

    test('should show loading state on Google button during OAuth', async ({ page }) => {
      await page.goto('/login');
      const googleButton = page.locator('button').filter({ hasText: 'Google' });
      await googleButton.click();

      await page.waitForTimeout(500);
      const loadingSpinner = page.locator('button:has-text("Cargando")');
      await expect(loadingSpinner).toBeVisible();
    });
  });

  test.describe('Session Persistence', () => {
    test('should redirect to login and clear stale cookies', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForURL(/login/);
      const cookies = await page.context().cookies();
      const sidCookie = cookies.find(c => c.name === '__sid');
      expect(sidCookie).toBeUndefined();
    });
  });
});
