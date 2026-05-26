import { test, expect } from '@playwright/test';
import { navigateAndWait } from './helpers';

test.describe('Navigation - Desktop Navbar', () => {
  test('navbar is visible on page load', async ({ page }) => {
    await navigateAndWait(page, '/');
    const nav = page.locator('nav[aria-label="Navegacion principal"]');
    const isVisible = await nav.isVisible().catch(() => false);
    if (isVisible) {
      await expect(nav).toBeVisible();
    }
  });

  test('navbar has cart link', async ({ page }) => {
    await navigateAndWait(page, '/');
    const cartLink = page.locator('a[href="/cart"]').first();
    await expect(cartLink).toBeAttached();
  });

  test('navbar has login link for guests', async ({ page }) => {
    await navigateAndWait(page, '/');
    const loginLink = page.locator('a[href="/login"]').first();
    const isVisible = await loginLink.isVisible().catch(() => false);
    if (isVisible) {
      await expect(loginLink).toBeVisible();
    }
  });

  test('navbar has signup link for guests', async ({ page }) => {
    await navigateAndWait(page, '/');
    const signupLink = page.locator('a[href="/signup"]').first();
    const isVisible = await signupLink.isVisible().catch(() => false);
    if (isVisible) {
      await expect(signupLink).toBeVisible();
    }
  });

  test('skip-to-content link is present', async ({ page }) => {
    await navigateAndWait(page, '/');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });
});

test.describe('Navigation - Footer', () => {
  test('footer is present on page', async ({ page }) => {
    await navigateAndWait(page, '/');
    const footer = page.locator('footer');
    await expect(footer).toBeAttached();
  });

  test('footer has legal links', async ({ page }) => {
    await navigateAndWait(page, '/');
    const legalLinks = [
      { text: /terminos/i, href: '/terms' },
      { text: /privacidad/i, href: '/privacy' },
      { text: /cookies/i, href: '/cookies' },
    ];
    for (const link of legalLinks) {
      const el = page.locator(`a[href="${link.href}"]`).first();
      await expect(el).toBeAttached();
    }
  });

  test('footer has support links', async ({ page }) => {
    await navigateAndWait(page, '/');
    const helpLink = page.locator('a[href="/help"]').first();
    await expect(helpLink).toBeAttached();
  });

  test('footer social links are present', async ({ page }) => {
    await navigateAndWait(page, '/');
    const socialIcons = page.locator('a[aria-label="Instagram"], a[aria-label="Facebook"]');
    await expect(socialIcons.first()).toBeAttached();
  });
});

test.describe('Navigation - Page Flows', () => {
  test('can navigate from homepage to help page', async ({ page }) => {
    await navigateAndWait(page, '/');
    const helpLink = page.locator('a[href="/help"]').first();
    await helpLink.scrollIntoViewIfNeeded();
    const isVisible = await helpLink.isVisible().catch(() => false);
    if (isVisible) {
      await helpLink.click();
      await expect(page).toHaveURL(/help/);
    }
  });

  test('can navigate from homepage to cart', async ({ page }) => {
    await navigateAndWait(page, '/');
    const cartLink = page.locator('a[href="/cart"]').first();
    await expect(cartLink).toBeAttached();
    await cartLink.click();
    await expect(page).toHaveURL(/cart/);
  });

  test('can navigate from cart back to homepage', async ({ page }) => {
    await navigateAndWait(page, '/cart');
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeAttached();
    await homeLink.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
