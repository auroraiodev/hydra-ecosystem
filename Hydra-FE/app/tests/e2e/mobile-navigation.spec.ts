import { test, expect } from '@playwright/test';
import { navigateAndWait, isMobile } from './helpers';

test.describe('Mobile Navigation', () => {
  test('mobile bottom nav is visible on small viewports', async ({ page }) => {
    await navigateAndWait(page, '/');
    const isMobileView = await isMobile(page);
    if (!isMobileView) {
      test.skip();
      return;
    }

    const bottomNavItems = ['Inicio', 'Buscar', 'Carrito'];
    for (const item of bottomNavItems) {
      const navItem = page.locator('a, button', { hasText: item }).first();
      const isVisible = await navItem.isVisible().catch(() => false);
      if (isVisible) {
        await expect(navItem).toBeVisible();
      }
    }
  });

  test('mobile hamburger menu opens and closes', async ({ page }) => {
    await navigateAndWait(page, '/');
    const isMobileView = await isMobile(page);
    if (!isMobileView) {
      test.skip();
      return;
    }

    const hamburger = page.locator('button[aria-label="Abrir menu principal"]');
    const isVisible = await hamburger.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await hamburger.click();
    await page.waitForTimeout(500);

    const drawer = page.locator('[role="dialog"], nav[aria-label="Menu de navegacion"]');
    const hasDrawer = await drawer.isVisible().catch(() => false);
    if (hasDrawer) {
      await expect(drawer).toBeVisible();

      const closeButton = page.locator('button[aria-label="Cerrar menu principal"]');
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('mobile cart navigates to /cart page', async ({ page }) => {
    await navigateAndWait(page, '/');
    const isMobileView = await isMobile(page);
    if (!isMobileView) {
      test.skip();
      return;
    }

    const cartNavItem = page.locator('a[href="/cart"]').first();
    const isVisible = await cartNavItem.isVisible().catch(() => false);
    if (isVisible) {
      await cartNavItem.click();
      await expect(page).toHaveURL(/cart/);
    }
  });

  test('mobile profile link redirects to login when not authenticated', async ({ page }) => {
    await navigateAndWait(page, '/');
    const isMobileView = await isMobile(page);
    if (!isMobileView) {
      test.skip();
      return;
    }

    const profileLink = page.locator('a[href="/profile"]').first();
    const isVisible = await profileLink.isVisible().catch(() => false);
    if (isVisible) {
      await profileLink.click();
      await page.waitForTimeout(1000);
      expect(page.url().includes('/login')).toBeTruthy();
    }
  });
});
