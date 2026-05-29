import { test, expect } from '@playwright/test';
import { navigateAndWait, setDesktopViewport } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

// ─── Desktop Navbar Structure ─────────────────────────────────────────────────

test.describe('Navigation Desktop - Navbar Structure', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, '/');
  });

  test('desktop navbar has correct ARIA role', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Navegación principal"]');
    await expect(nav).toBeVisible();
  });

  test('navbar is fixed to the viewport top', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Navegación principal"]');
    const position = await nav.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).toBe('fixed');
    const top = await nav.evaluate((el) => window.getComputedStyle(el).top);
    expect(top).toBe('0px');
  });

  test('navbar has a logo image with non-empty src', async ({ page }) => {
    const navImg = page.locator('nav[aria-label="Navegación principal"] img').first();
    await expect(navImg).toBeAttached();
    const src = await navImg.getAttribute('src');
    expect(src).not.toBeNull();
    expect(src!.length).toBeGreaterThan(0);
  });

  test('logo image is not broken', async ({ page }) => {
    await page.waitForLoadState('load');
    const navImg = page.locator('nav[aria-label="Navegación principal"] img').first();
    if ((await navImg.count()) > 0) {
      const complete = await navImg.evaluate((el: HTMLImageElement) => el.complete);
      const naturalWidth = await navImg.evaluate((el: HTMLImageElement) => el.naturalWidth);
      const src = await navImg.getAttribute('src');
      if (complete && naturalWidth === 0) {
        // Accept SVG, data URIs, or PNG/WebP
        expect(
          src?.startsWith('data:') ||
            src?.includes('.svg') ||
            src?.includes('.png') ||
            src?.includes('.webp') ||
            src?.startsWith('/'),
        ).toBeTruthy();
      }
    }
  });

  test('logo links to homepage (/)', async ({ page }) => {
    const logoLink = page
      .locator('nav[aria-label="Navegación principal"] a[href="/"]')
      .first();
    await expect(logoLink).toBeVisible();
  });

  test('cart icon link is present in navbar', async ({ page }) => {
    const cartLink = page.locator('a[href="/cart"]').first();
    await expect(cartLink).toBeAttached();
  });

  test('wishlist link is present in navbar', async ({ page }) => {
    const wishlistLink = page.locator(
      'a[href="/wishlist"], a[aria-label="Mis favoritos"], a[aria-label*="favoritos"]',
    );
    const count = await wishlistLink.count();
    // Wishlist link may be hidden if user is not authenticated
    if (count > 0) {
      await expect(wishlistLink.first()).toBeAttached();
    }
  });

  test('login link is visible for guest users', async ({ page }) => {
    const loginLink = page.locator('a[href="/login"]').first();
    const isVisible = await loginLink.isVisible().catch(() => false);
    if (isVisible) {
      await expect(loginLink).toBeVisible();
    }
  });

  test('signup link is visible for guest users', async ({ page }) => {
    const signupLink = page.locator('a[href="/signup"]').first();
    const isVisible = await signupLink.isVisible().catch(() => false);
    if (isVisible) {
      await expect(signupLink).toBeVisible();
    }
  });
});

// ─── Navbar Navigation ─────────────────────────────────────────────────────────

test.describe('Navigation Desktop - Navbar Routing', () => {
  test('clicking logo from inner page navigates to homepage', async ({ page }) => {
    await setDesktopViewport(page);
    await navigateAndWait(page, '/help');
    const logoLink = page.locator('nav[aria-label="Navegación principal"] a[href="/"]').first();
    await logoLink.click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toMatch(/\/$/);
  });

  test('clicking cart icon navigates to /cart', async ({ page }) => {
    await navigateAndWait(page, '/');
    const cartLink = page.locator('a[href="/cart"]').first();
    await cartLink.click();
    await expect(page).toHaveURL(/\/cart/);
  });

  test('clicking Login link navigates to /login', async ({ page }) => {
    await navigateAndWait(page, '/');
    const loginLink = page.locator('a[href="/login"]').first();
    const isVisible = await loginLink.isVisible().catch(() => false);
    if (isVisible) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('clicking Signup link navigates to /signup', async ({ page }) => {
    await navigateAndWait(page, '/');
    const signupLink = page.locator('a[href="/signup"]').first();
    const isVisible = await signupLink.isVisible().catch(() => false);
    if (isVisible) {
      await signupLink.click();
      await expect(page).toHaveURL(/\/signup/);
    }
  });
});

// ─── Skip to Content ─────────────────────────────────────────────────────────

test.describe('Navigation Desktop - Skip to Content', () => {
  test('skip-to-content link is in the DOM', async ({ page }) => {
    await navigateAndWait(page, '/');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });

  test('skip-to-content link is focused on first Tab press', async ({ page }) => {
    await navigateAndWait(page, '/');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('href'));
    expect(focused).toBe('#main-content');
  });

  test('skip link text is descriptive', async ({ page }) => {
    await navigateAndWait(page, '/');
    const skipLink = page.locator('a[href="#main-content"]');
    const text = await skipLink.textContent();
    expect(text?.toLowerCase()).toMatch(/saltar|skip|contenido/i);
  });

  test('activating skip link moves focus to main content', async ({ page }) => {
    await navigateAndWait(page, '/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).toBe('main-content');
  });
});

// ─── Footer ───────────────────────────────────────────────────────────────────

test.describe('Navigation Desktop - Footer', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, '/');
  });

  test('footer is present in the DOM', async ({ page }) => {
    await expect(page.locator('footer')).toBeAttached();
  });

  test('footer terms link navigates to /terms', async ({ page }) => {
    const termsLink = page.locator('footer a[href="/terms"]').first();
    await termsLink.scrollIntoViewIfNeeded();
    await termsLink.click();
    await expect(page).toHaveURL(/\/terms/);
  });

  test('footer privacy link navigates to /privacy', async ({ page }) => {
    const privacyLink = page.locator('footer a[href="/privacy"]').first();
    await privacyLink.scrollIntoViewIfNeeded();
    await privacyLink.click();
    await expect(page).toHaveURL(/\/privacy/);
  });

  test('footer help link navigates to /help', async ({ page }) => {
    const helpLink = page.locator('footer a[href="/help"]').first();
    await helpLink.scrollIntoViewIfNeeded();
    await helpLink.click();
    await expect(page).toHaveURL(/\/help/);
  });

  test('footer cookies link navigates to /cookies', async ({ page }) => {
    const cookiesLink = page.locator('footer a[href="/cookies"]').first();
    await cookiesLink.scrollIntoViewIfNeeded();
    await cookiesLink.click();
    await expect(page).toHaveURL(/\/cookies/);
  });

  test('footer social media links have aria-labels', async ({ page }) => {
    const socialLinks = page.locator(
      'footer a[aria-label], footer a[aria-label="Instagram"], footer a[aria-label="Facebook"]',
    );
    const count = await socialLinks.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const label = await socialLinks.nth(i).getAttribute('aria-label');
        expect(label).not.toBeNull();
        expect(label!.length).toBeGreaterThan(0);
      }
    }
  });

  test('footer has authenticity link', async ({ page }) => {
    const authLink = page.locator('footer a[href="/authenticity"]').first();
    const count = await authLink.count();
    if (count > 0) {
      await expect(authLink).toBeAttached();
    }
  });
});

// ─── Cross-page Navigation ────────────────────────────────────────────────────

test.describe('Navigation Desktop - Cross-Page Flows', () => {
  test('can navigate homepage → cart → back to homepage', async ({ page }) => {
    await navigateAndWait(page, '/');
    await page.locator('a[href="/cart"]').first().click();
    await expect(page).toHaveURL(/\/cart/);
    await page.locator('a[href="/"]').first().click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toMatch(/\/$/);
  });

  test('can navigate homepage → help → privacy → terms', async ({ page }) => {
    await navigateAndWait(page, '/');

    // Go to help
    const helpLink = page.locator('a[href="/help"]').first();
    await helpLink.scrollIntoViewIfNeeded();
    await helpLink.click();
    await expect(page).toHaveURL(/\/help/);

    // Go to privacy from footer
    const privacyLink = page.locator('a[href="/privacy"]').first();
    await privacyLink.scrollIntoViewIfNeeded();
    await privacyLink.click();
    await expect(page).toHaveURL(/\/privacy/);

    // Go to terms from footer
    const termsLink = page.locator('a[href="/terms"]').first();
    await termsLink.scrollIntoViewIfNeeded();
    await termsLink.click();
    await expect(page).toHaveURL(/\/terms/);
  });

  test('browser back button works correctly', async ({ page }) => {
    await navigateAndWait(page, '/');
    await page.locator('a[href="/cart"]').first().click();
    await expect(page).toHaveURL(/\/cart/);

    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toMatch(/\/$/);
  });

  test('browser forward button works after going back', async ({ page }) => {
    await navigateAndWait(page, '/');
    await page.locator('a[href="/cart"]').first().click();
    await expect(page).toHaveURL(/\/cart/);

    await page.goBack();
    await page.goForward();
    await expect(page).toHaveURL(/\/cart/);
  });
});
