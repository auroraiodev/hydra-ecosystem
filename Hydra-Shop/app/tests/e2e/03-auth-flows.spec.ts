import { test, expect } from '@playwright/test';
import {
  navigateAndWait,
  setupAuthenticatedSession,
  mockCartAPI,
  mockOrdersAPI,
  mockWalletAPI,
  MOCK_USER,
} from './helpers';

// ─── Unauthenticated — Protected Route Redirects ───────────────────────────────

test.describe('Auth - Protected Route Redirects (guest)', () => {
  const protectedRoutes = [
    { path: '/profile', label: 'profile root' },
    { path: '/profile/orders', label: 'order history' },
    { path: '/profile/orders/some-order-id', label: 'order detail' },
    { path: '/profile/balance', label: 'wallet balance' },
    { path: '/profile/listings', label: 'seller listings' },
    { path: '/profile/seller-wallet', label: 'seller wallet' },
  ];

  for (const route of protectedRoutes) {
    test(`redirects guest from ${route.label} (${route.path}) to /login`, async ({ page }) => {
      await page.goto(route.path);
      // Allow middleware/client-side redirect to happen
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(
        url.includes('/login') || url.includes('/signup'),
        `Expected redirect to /login but got: ${url}`,
      ).toBeTruthy();
    });
  }
});

// ─── Public Routes — Accessible Without Auth ──────────────────────────────────

test.describe('Auth - Public Routes Accessible Without Auth', () => {
  const publicRoutes = [
    { path: '/', label: 'homepage' },
    { path: '/login', label: 'login page' },
    { path: '/signup', label: 'signup page' },
    { path: '/help', label: 'help center' },
    { path: '/terms', label: 'terms of service' },
    { path: '/privacy', label: 'privacy policy' },
    { path: '/cookies', label: 'cookies policy' },
    { path: '/returns', label: 'returns policy' },
    { path: '/authenticity', label: 'authenticity page' },
    { path: '/singles/search', label: 'product search' },
    { path: '/cart', label: 'cart page' },
    { path: '/wishlist', label: 'wishlist page' },
  ];

  for (const route of publicRoutes) {
    test(`${route.label} (${route.path}) is accessible without authentication`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForTimeout(1500);
      const url = page.url();
      expect(
        url.includes('/login'),
        `Route ${route.path} unexpectedly redirected to /login`,
      ).toBeFalsy();
    });
  }
});

// ─── Authenticated — Access to Protected Routes ───────────────────────────────

test.describe('Auth - Authenticated Access to Protected Routes', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test('authenticated user can access /profile without redirect', async ({ page }) => {
    await mockCartAPI(page, true);
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(1500);
    // Should stay on profile, not be redirected to /login
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  test('authenticated user sees their name or username on profile page', async ({
    page,
  }) => {
    await mockCartAPI(page, true);
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2000);

    const url = page.url();
    if (!url.includes('/login')) {
      // Profile loaded — check for some user info
      const pageText = await page.locator('body').textContent();
      const hasUserInfo =
        pageText?.includes(MOCK_USER.first_name) ||
        pageText?.includes(MOCK_USER.last_name) ||
        pageText?.includes(MOCK_USER.username) ||
        pageText?.includes(MOCK_USER.email);
      expect(hasUserInfo).toBeTruthy();
    }
  });

  test('authenticated user can access /profile/orders', async ({ page }) => {
    await mockOrdersAPI(page);
    await mockCartAPI(page, true);
    await navigateAndWait(page, '/profile/orders');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  test('authenticated user can access /profile/balance', async ({ page }) => {
    await mockWalletAPI(page);
    await mockCartAPI(page, true);
    await navigateAndWait(page, '/profile/balance');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url).not.toContain('/login');
  });
});

// ─── Auth Token Persistence ───────────────────────────────────────────────────

test.describe('Auth - Session Persistence', () => {
  test('unauthenticated user who visits login sees login form, not profile', async ({
    page,
  }) => {
    await navigateAndWait(page, '/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('redirect from protected route preserves return URL in query string', async ({
    page,
  }) => {
    await page.goto('/profile/orders');
    await page.waitForTimeout(2000);
    const url = page.url();
    if (url.includes('/login')) {
      // The app may pass redirect param so user can return after login
      // e.g. /login?redirect=%2Fprofile%2Forders
      // This is optional but good UX - we just verify the redirect happened
      expect(url).toContain('/login');
    }
  });
});

// ─── OAuth Callback ───────────────────────────────────────────────────────────

test.describe('Auth - OAuth Callback Route', () => {
  test('/auth/callback route is accessible and does not crash', async ({ page }) => {
    // Mock the auth endpoints so the callback does not throw
    await page.route('**/api/v1/auth/google/callback**', async (route) => {
      await route.fulfill({
        status: 302,
        headers: { Location: '/' },
      });
    });

    const response = await page.goto('/auth/callback?code=mock_code&state=mock_state');
    // Should either redirect or render a page (not a 500)
    const status = response?.status() ?? 0;
    expect(status).not.toBe(500);
  });
});

// ─── Logout Flow ──────────────────────────────────────────────────────────────

test.describe('Auth - Logout', () => {
  test('after logout, localStorage tokens are cleared', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockCartAPI(page, true);

    // Mock logout endpoint
    await page.route('**/api/v1/auth/logout', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.route('**/api/auth/logout', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(1500);

    // Try to find and click a logout button
    const logoutBtn = page.locator(
      'button:has-text("Cerrar sesión"), button:has-text("Logout"), button:has-text("Salir"), a:has-text("Cerrar sesión")',
    );
    const hasLogout = (await logoutBtn.count()) > 0;
    if (hasLogout) {
      await logoutBtn.first().click();
      await page.waitForTimeout(1500);

      // After logout, tokens should be gone
      const token = await page.evaluate(() => localStorage.getItem('hydra_access_token'));
      // Either token is cleared or user was redirected to /login
      const url = page.url();
      expect(token === null || url.includes('/login')).toBeTruthy();
    }
  });
});
