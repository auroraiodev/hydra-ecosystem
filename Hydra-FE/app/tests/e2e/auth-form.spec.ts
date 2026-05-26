import { test, expect } from '@playwright/test';
import { fillInput, clickButton, navigateAndWait } from './helpers';

test.describe('Auth - Login Form Interactions', () => {
  test('login page renders all form elements', async ({ page }) => {
    await navigateAndWait(page, '/login');

    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await expect(page.locator('label[for="email"]')).toHaveText(/email/i);
  });

  test('login form shows validation on empty submit', async ({ page }) => {
    await navigateAndWait(page, '/login');
    await clickButton(page, 'Iniciar Sesion');

    await page.waitForTimeout(500);
    const emailValidity = await page.locator('#email').evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(emailValidity.length).toBeGreaterThan(0);
  });

  test('login form rejects invalid credentials', async ({ page }) => {
    await navigateAndWait(page, '/login');

    await fillInput(page, 'email', 'nonexistent@test.com');
    await fillInput(page, 'password', 'wrongpassword123');
    await clickButton(page, 'Iniciar Sesion');

    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('password field has show/hide toggle', async ({ page }) => {
    await navigateAndWait(page, '/login');

    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = page.locator('button[aria-label*="Mostrar"]');
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      const hideButton = page.locator('button[aria-label*="Ocultar"]');
      await expect(hideButton).toBeVisible();
    }
  });

  test('login page has link to signup', async ({ page }) => {
    await navigateAndWait(page, '/login');

    const signupLink = page.locator('a[href="/signup"]');
    await expect(signupLink.first()).toBeVisible();

    await signupLink.first().click();
    await expect(page).toHaveURL(/signup/);
  });

  test('login page has back navigation to home', async ({ page }) => {
    await navigateAndWait(page, '/login');

    const backLink = page.locator('a[href="/"]').first();
    const isVisible = await backLink.isVisible().catch(() => false);
    if (isVisible) {
      await backLink.click();
      await expect(page).toHaveURL(/\/$/);
    }
  });
});

test.describe('Auth - Signup Form Interactions', () => {
  test('signup page renders all form fields', async ({ page }) => {
    await navigateAndWait(page, '/signup');

    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#terms')).toBeVisible();

    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('signup form shows validation on empty submit', async ({ page }) => {
    await navigateAndWait(page, '/signup');
    await clickButton(page, 'Crear Cuenta');

    await page.waitForTimeout(500);
    const firstNameValidity = await page.locator('#firstName').evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(firstNameValidity.length).toBeGreaterThan(0);
  });

  test('signup page has link back to login', async ({ page }) => {
    await navigateAndWait(page, '/signup');

    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink.first()).toBeVisible();

    await loginLink.first().click();
    await expect(page).toHaveURL(/login/);
  });

  test('username field enforces minimum length', async ({ page }) => {
    await navigateAndWait(page, '/signup');

    const usernameInput = page.locator('#username');
    const minLength = await usernameInput.getAttribute('minLength');
    expect(minLength).not.toBeNull();
    expect(Number(minLength)).toBeGreaterThanOrEqual(3);
  });

  test('password field enforces minimum length', async ({ page }) => {
    await navigateAndWait(page, '/signup');

    const passwordInput = page.locator('#password');
    const minLength = await passwordInput.getAttribute('minLength');
    expect(minLength).not.toBeNull();
    expect(Number(minLength)).toBeGreaterThanOrEqual(8);
  });

  test('terms checkbox is link to terms and privacy', async ({ page }) => {
    await navigateAndWait(page, '/signup');

    const termsLink = page.locator('a[href="/terms"]');
    await expect(termsLink.first()).toBeVisible();

    const privacyLink = page.locator('a[href="/privacy"]');
    await expect(privacyLink.first()).toBeVisible();
  });
});

test.describe('Auth - Protected Routes', () => {
  const protectedRoutes = [
    { path: '/profile', desc: 'profile root' },
    { path: '/profile/orders', desc: 'profile orders' },
    { path: '/profile/balance', desc: 'profile balance' },
    { path: '/profile/listings', desc: 'profile listings' },
  ];

  for (const route of protectedRoutes) {
    test(`redirects unauthenticated users from ${route.desc}`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForTimeout(1500);
      const url = page.url();
      expect(url.includes('/login')).toBeTruthy();
    });
  }

  test('public routes are accessible without auth', async ({ page }) => {
    const publicRoutes = ['/', '/browse', '/singles', '/cart', '/wishlist', '/checkout', '/sell', '/help'];
    for (const route of publicRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url.includes('/login')).toBeFalsy();
    }
  });
});
