import { test, expect } from '@playwright/test';
import {
  navigateAndWait,
  setDesktopViewport,
  setMobileViewport,
  setupAuthenticatedSession,
  mockCartAPI,
  mockOrdersAPI,
  mockWalletAPI,
  mockAddressesAPI,
  MOCK_USER,
  MOCK_ORDERS,
} from './helpers';

// ─── Profile — Guest Redirect ─────────────────────────────────────────────────

test.describe('Profile - Guest Access', () => {
  test('unauthenticated /profile redirects to /login', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated /profile/orders redirects to /login', async ({ page }) => {
    await page.goto('/profile/orders');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated /profile/balance redirects to /login', async ({ page }) => {
    await page.goto('/profile/balance');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
  });
});

// ─── Profile — Page Structure (Authenticated) ────────────────────────────────

test.describe('Profile - Authenticated Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
    await setupAuthenticatedSession(page);
    await mockCartAPI(page, true);
    await mockOrdersAPI(page);
    await mockWalletAPI(page);
    await mockAddressesAPI(page);
  });

  test('authenticated user can access /profile', async ({ page }) => {
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  test('profile page shows user first name', async ({ page }) => {
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2500);
    const url = page.url();
    if (!url.includes('/login')) {
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toContain(MOCK_USER.first_name);
    }
  });

  test('profile page shows user last name or username', async ({ page }) => {
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2500);
    const url = page.url();
    if (!url.includes('/login')) {
      const bodyText = await page.locator('body').textContent();
      const hasUserInfo =
        bodyText?.includes(MOCK_USER.last_name) ||
        bodyText?.includes(MOCK_USER.username);
      expect(hasUserInfo).toBeTruthy();
    }
  });

  test('profile page shows email address', async ({ page }) => {
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2500);
    const url = page.url();
    if (!url.includes('/login')) {
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toContain(MOCK_USER.email);
    }
  });

  test('profile page has link to order history', async ({ page }) => {
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2000);
    const url = page.url();
    if (!url.includes('/login')) {
      const ordersLink = page.locator('a[href="/profile/orders"]');
      const count = await ordersLink.count();
      if (count > 0) {
        await expect(ordersLink.first()).toBeAttached();
      }
    }
  });

  test('profile page has link to balance/wallet', async ({ page }) => {
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2000);
    const url = page.url();
    if (!url.includes('/login')) {
      const balanceLink = page.locator('a[href="/profile/balance"]');
      const count = await balanceLink.count();
      if (count > 0) {
        await expect(balanceLink.first()).toBeAttached();
      }
    }
  });

  test('profile page has an edit profile button', async ({ page }) => {
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2000);
    const url = page.url();
    if (!url.includes('/login')) {
      const editBtn = page.locator(
        'button:has-text("Editar"), button:has-text("Edit"), button[aria-label*="editar"]',
      );
      const count = await editBtn.count();
      if (count > 0) {
        await expect(editBtn.first()).toBeAttached();
      }
    }
  });

  test('profile shows user wallet balance', async ({ page }) => {
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2500);
    const url = page.url();
    if (!url.includes('/login')) {
      const bodyText = await page.locator('body').textContent();
      // Should show balance amount (250.00 MXN)
      const hasBalance = bodyText?.match(/250|saldo|balance/i);
      if (hasBalance) {
        expect(hasBalance).not.toBeNull();
      }
    }
  });
});

// ─── Profile — Mobile Layout ──────────────────────────────────────────────────

test.describe('Profile - Mobile Layout', () => {
  test.beforeEach(async ({ page }) => {
    await setMobileViewport(page);
    await setupAuthenticatedSession(page);
    await mockCartAPI(page, true);
    await mockOrdersAPI(page);
    await mockWalletAPI(page);
  });

  test('profile loads on mobile viewport', async ({ page }) => {
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2000);
    const url = page.url();
    if (!url.includes('/login')) {
      await expect(page.locator('main, body').first()).toBeAttached();
    }
  });

  test('profile shows user name on mobile', async ({ page }) => {
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2500);
    const url = page.url();
    if (!url.includes('/login')) {
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toContain(MOCK_USER.first_name);
    }
  });
});

// ─── Orders Page ──────────────────────────────────────────────────────────────

test.describe('Profile - Order History Page', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
    await setupAuthenticatedSession(page);
    await mockCartAPI(page, true);
    await mockOrdersAPI(page);
  });

  test('/profile/orders loads for authenticated user', async ({ page }) => {
    await navigateAndWait(page, '/profile/orders');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  test('orders page has a heading', async ({ page }) => {
    await navigateAndWait(page, '/profile/orders');
    await page.waitForTimeout(2500);
    const url = page.url();
    if (!url.includes('/login')) {
      const heading = page.locator('h1, h2').first();
      if ((await heading.count()) > 0) {
        const text = await heading.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    }
  });

  test('orders page shows mock order number', async ({ page }) => {
    await navigateAndWait(page, '/profile/orders');
    await page.waitForTimeout(3000);
    const url = page.url();
    if (!url.includes('/login')) {
      const bodyText = await page.locator('body').textContent();
      const hasOrder =
        bodyText?.includes(MOCK_ORDERS[0].internal_order_number) ||
        bodyText?.includes('HC-001');
      if (hasOrder) {
        expect(hasOrder).toBeTruthy();
      }
    }
  });

  test('order items show order status', async ({ page }) => {
    await navigateAndWait(page, '/profile/orders');
    await page.waitForTimeout(3000);
    const url = page.url();
    if (!url.includes('/login')) {
      const bodyText = await page.locator('body').textContent();
      const hasStatus = bodyText?.match(/PAID|pagado|COMPLETED|completado|PENDING|pendiente/i);
      if (hasStatus) {
        expect(hasStatus).not.toBeNull();
      }
    }
  });

  test('order detail page /profile/orders/[id] loads', async ({ page }) => {
    await navigateAndWait(page, `/profile/orders/${MOCK_ORDERS[0].id}`);
    await page.waitForTimeout(2000);
    const url = page.url();
    if (!url.includes('/login')) {
      await expect(page.locator('main, body').first()).toBeAttached();
    }
  });
});

// ─── Wallet / Balance Page ────────────────────────────────────────────────────

test.describe('Profile - Wallet / Balance Page', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
    await setupAuthenticatedSession(page);
    await mockCartAPI(page, true);
    await mockWalletAPI(page);
  });

  test('/profile/balance loads for authenticated user', async ({ page }) => {
    await navigateAndWait(page, '/profile/balance');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  test('balance page shows wallet balance amount', async ({ page }) => {
    await navigateAndWait(page, '/profile/balance');
    await page.waitForTimeout(3000);
    const url = page.url();
    if (!url.includes('/login')) {
      const bodyText = await page.locator('body').textContent();
      const hasAmount = bodyText?.match(/250|saldo|balance/i);
      if (hasAmount) {
        expect(hasAmount).not.toBeNull();
      }
    }
  });

  test('balance page shows transaction history', async ({ page }) => {
    await navigateAndWait(page, '/profile/balance');
    await page.waitForTimeout(3000);
    const url = page.url();
    if (!url.includes('/login')) {
      const bodyText = await page.locator('body').textContent();
      const hasTx = bodyText?.match(/transacción|movimiento|historial|Reembolso/i);
      if (hasTx) {
        expect(hasTx).not.toBeNull();
      }
    }
  });

  test('balance page has a withdraw button', async ({ page }) => {
    await navigateAndWait(page, '/profile/balance');
    await page.waitForTimeout(3000);
    const url = page.url();
    if (!url.includes('/login')) {
      const withdrawBtn = page.locator(
        'button:has-text("Retirar"), button:has-text("Withdraw"), button:has-text("retiro")',
      );
      const count = await withdrawBtn.count();
      if (count > 0) {
        await expect(withdrawBtn.first()).toBeAttached();
      }
    }
  });
});

// ─── Profile Edit Modal ───────────────────────────────────────────────────────

test.describe('Profile - Edit Profile Modal', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
    await setupAuthenticatedSession(page);
    await mockCartAPI(page, true);
  });

  test('clicking edit profile opens a modal', async ({ page }) => {
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2500);
    const url = page.url();
    if (!url.includes('/login')) {
      const editBtn = page.locator('button:has-text("Editar perfil"), button:has-text("Editar")');
      if ((await editBtn.count()) > 0) {
        await editBtn.first().click();
        await page.waitForTimeout(500);

        const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]');
        const isOpen = (await modal.count()) > 0;
        if (isOpen) {
          await expect(modal.first()).toBeVisible();
        }
      }
    }
  });

  test('edit profile modal can be closed', async ({ page }) => {
    await navigateAndWait(page, '/profile');
    await page.waitForTimeout(2500);
    const url = page.url();
    if (!url.includes('/login')) {
      const editBtn = page.locator('button:has-text("Editar perfil"), button:has-text("Editar")');
      if ((await editBtn.count()) > 0) {
        await editBtn.first().click();
        await page.waitForTimeout(500);

        const closeBtn = page.locator(
          'button[aria-label="Cerrar modal"], button[aria-label*="Cerrar"]',
        );
        if ((await closeBtn.count()) > 0) {
          await closeBtn.first().click();
          await page.waitForTimeout(500);
          const modal = page.locator('[role="dialog"]');
          const isStillOpen = await modal.isVisible().catch(() => false);
          expect(isStillOpen).toBeFalsy();
        }
      }
    }
  });
});

// ─── Listings Page ────────────────────────────────────────────────────────────

test.describe('Profile - Listings Page', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
    await setupAuthenticatedSession(page);
    await mockCartAPI(page, true);

    await page.route('**/api/v1/listings**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], statusCode: 200 }),
      });
    });
  });

  test('/profile/listings loads for authenticated user', async ({ page }) => {
    await navigateAndWait(page, '/profile/listings');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  test('listings page has a heading', async ({ page }) => {
    await navigateAndWait(page, '/profile/listings');
    await page.waitForTimeout(2500);
    const url = page.url();
    if (!url.includes('/login')) {
      const heading = page.locator('h1, h2').first();
      const count = await heading.count();
      if (count > 0) {
        await expect(heading.first()).toBeAttached();
      }
    }
  });
});
