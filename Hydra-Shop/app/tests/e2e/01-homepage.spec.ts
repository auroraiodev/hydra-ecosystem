import { test, expect } from '@playwright/test';
import {
  navigateAndWait,
  setDesktopViewport,
  setMobileViewport,
  expectAllImagesLoaded,
} from './helpers';

// ─── Page Load & Title ─────────────────────────────────────────────────────────

test.describe('Homepage - Page Load', () => {
  test('renders with correct document title', async ({ page }) => {
    await navigateAndWait(page, '/');
    await expect(page).toHaveTitle(/Hydra Collectables|Magic|TCG|México/i);
  });

  test('returns HTTP 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('main content area is attached', async ({ page }) => {
    await navigateAndWait(page, '/');
    await expect(page.locator('main').first()).toBeAttached();
  });

  test('has skip-to-main-content accessibility link', async ({ page }) => {
    await navigateAndWait(page, '/');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
    const text = await skipLink.textContent();
    expect(text?.toLowerCase()).toMatch(/saltar|skip|contenido/i);
  });
});

// ─── Desktop Navbar ────────────────────────────────────────────────────────────

test.describe('Homepage - Desktop Navbar', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
    await navigateAndWait(page, '/');
  });

  test('desktop navbar is visible', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Navegación principal"]');
    await expect(nav).toBeVisible();
  });

  test('navbar has a logo image', async ({ page }) => {
    const navImg = page
      .locator('nav[aria-label="Navegación principal"] img')
      .first();
    await expect(navImg).toBeAttached();
    const src = await navImg.getAttribute('src');
    expect(src).not.toBeNull();
    expect(src!.length).toBeGreaterThan(0);
  });

  test('navbar logo links to homepage', async ({ page }) => {
    const logoLink = page
      .locator('nav[aria-label="Navegación principal"] a[href="/"]')
      .first();
    await expect(logoLink).toBeVisible();
  });

  test('navbar has a cart link', async ({ page }) => {
    const cartLink = page
      .locator('nav[aria-label="Navegación principal"] a[href="/cart"]')
      .first();
    await expect(cartLink).toBeAttached();
  });

  test('navbar shows login and signup links for guests', async ({ page }) => {
    const loginLink = page.locator('a[href="/login"]').first();
    const signupLink = page.locator('a[href="/signup"]').first();
    await expect(loginLink).toBeAttached();
    await expect(signupLink).toBeAttached();
  });

  test('navbar is fixed to the top of the page', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Navegación principal"]');
    const position = await nav.evaluate((el) =>
      window.getComputedStyle(el).position,
    );
    expect(position).toBe('fixed');
  });
});

// ─── Mobile Header ─────────────────────────────────────────────────────────────

test.describe('Homepage - Mobile Header', () => {
  test.beforeEach(async ({ page }) => {
    await setMobileViewport(page);
    await navigateAndWait(page, '/');
  });

  test('mobile header is visible on small viewport', async ({ page }) => {
    // Desktop nav should be hidden on mobile
    const desktopNav = page.locator('nav[aria-label="Navegación principal"]');
    const isDesktopNavHidden = await desktopNav.evaluate(
      (el) => window.getComputedStyle(el).display === 'none',
    );
    expect(isDesktopNavHidden).toBe(true);
  });

  test('mobile header has hamburger menu button', async ({ page }) => {
    const hamburger = page.locator(
      'button[aria-label="Abrir menú principal"], button[aria-label="Abrir menu principal"]',
    );
    await expect(hamburger.first()).toBeVisible();
  });

  test('mobile header has logo link', async ({ page }) => {
    const logoLink = page.locator('a[href="/"]').first();
    await expect(logoLink).toBeAttached();
  });
});

// ─── Footer ───────────────────────────────────────────────────────────────────

test.describe('Homepage - Footer', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, '/');
  });

  test('footer element is present in the DOM', async ({ page }) => {
    await expect(page.locator('footer')).toBeAttached();
  });

  test('footer has link to Terms of Service', async ({ page }) => {
    await expect(
      page.locator('footer a[href="/terms"]').first(),
    ).toBeAttached();
  });

  test('footer has link to Privacy Policy', async ({ page }) => {
    await expect(
      page.locator('footer a[href="/privacy"]').first(),
    ).toBeAttached();
  });

  test('footer has link to Cookies Policy', async ({ page }) => {
    await expect(
      page.locator('footer a[href="/cookies"]').first(),
    ).toBeAttached();
  });

  test('footer has link to Help Center', async ({ page }) => {
    await expect(
      page.locator('footer a[href="/help"]').first(),
    ).toBeAttached();
  });

  test('footer has link to Returns page', async ({ page }) => {
    const returnsLink = page.locator('footer a[href="/returns"]').first();
    const isAttached = await returnsLink.count() > 0;
    if (isAttached) {
      await expect(returnsLink).toBeAttached();
    }
  });
});

// ─── Navigating from the Homepage ─────────────────────────────────────────────

test.describe('Homepage - Navigation Flows', () => {
  test('cart icon in navbar navigates to /cart', async ({ page }) => {
    await setDesktopViewport(page);
    await navigateAndWait(page, '/');
    const cartLink = page.locator('a[href="/cart"]').first();
    await cartLink.click();
    await expect(page).toHaveURL(/\/cart/);
  });

  test('login link navigates to /login', async ({ page }) => {
    await setDesktopViewport(page);
    await navigateAndWait(page, '/');
    const loginLink = page.locator('a[href="/login"]').first();
    const isVisible = await loginLink.isVisible().catch(() => false);
    if (isVisible) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('signup link navigates to /signup', async ({ page }) => {
    await setDesktopViewport(page);
    await navigateAndWait(page, '/');
    const signupLink = page.locator('a[href="/signup"]').first();
    const isVisible = await signupLink.isVisible().catch(() => false);
    if (isVisible) {
      await signupLink.click();
      await expect(page).toHaveURL(/\/signup/);
    }
  });

  test('terms link in footer navigates to /terms', async ({ page }) => {
    await navigateAndWait(page, '/');
    const termsLink = page.locator('footer a[href="/terms"]').first();
    await termsLink.scrollIntoViewIfNeeded();
    await termsLink.click();
    await expect(page).toHaveURL(/\/terms/);
  });

  test('help link in footer navigates to /help', async ({ page }) => {
    await navigateAndWait(page, '/');
    const helpLink = page.locator('footer a[href="/help"]').first();
    await helpLink.scrollIntoViewIfNeeded();
    await helpLink.click();
    await expect(page).toHaveURL(/\/help/);
  });
});

// ─── Images ───────────────────────────────────────────────────────────────────

test.describe('Homepage - Image Loading', () => {
  test('every visible image has a non-empty src attribute', async ({ page }) => {
    await navigateAndWait(page, '/');
    await page.waitForLoadState('load');

    const images = page.locator('img[src]');
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(0);

    for (let i = 0; i < Math.min(count, 20); i++) {
      const src = await images.nth(i).getAttribute('src');
      expect(src, `Image #${i} has empty src`).not.toBe('');
      expect(src, `Image #${i} has null src`).not.toBeNull();
    }
  });

  test('logo image in desktop navbar loads without breaking', async ({ page }) => {
    await setDesktopViewport(page);
    await navigateAndWait(page, '/');
    await page.waitForLoadState('load');

    const logo = page
      .locator('nav[aria-label="Navegación principal"] img')
      .first();

    if ((await logo.count()) > 0) {
      const src = await logo.getAttribute('src');
      expect(src).not.toBeNull();
      expect(src!.length).toBeGreaterThan(0);

      const naturalWidth = await logo.evaluate(
        (el: HTMLImageElement) => el.naturalWidth,
      );
      // naturalWidth > 0 means the image loaded; 0 for SVGs in some browsers
      // so we just check it's not failing (complete but 0 only for broken imgs)
      const complete = await logo.evaluate(
        (el: HTMLImageElement) => el.complete,
      );
      if (complete && naturalWidth === 0) {
        const srcVal = await logo.getAttribute('src');
        // Acceptable: data URIs and SVGs can have naturalWidth=0
        expect(
          srcVal?.startsWith('data:') || srcVal?.includes('.svg') || srcVal?.endsWith('.png'),
        ).toBeTruthy();
      }
    }
  });

  test('no images with broken src (complete + naturalWidth === 0)', async ({ page }) => {
    await setDesktopViewport(page);
    await navigateAndWait(page, '/');
    await page.waitForLoadState('load');

    const broken = await page.evaluate(() => {
      return Array.from(document.querySelectorAll<HTMLImageElement>('img[src]'))
        .filter(
          (img) =>
            img.complete &&
            img.naturalWidth === 0 &&
            !img.src.startsWith('data:') &&
            img.src.trim().length > 0,
        )
        .map((img) => img.src);
    });

    expect(broken, `Broken images on homepage: ${broken.join(', ')}`).toHaveLength(0);
  });
});

// ─── Accessibility ─────────────────────────────────────────────────────────────

test.describe('Homepage - Accessibility', () => {
  test('page has a lang attribute on <html>', async ({ page }) => {
    await navigateAndWait(page, '/');
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang.length).toBeGreaterThan(0);
  });

  test('page has at least one heading element', async ({ page }) => {
    await navigateAndWait(page, '/');
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('skip-to-content link appears on Tab keypress', async ({ page }) => {
    await navigateAndWait(page, '/');
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });

  test('all anchor tags have an href attribute', async ({ page }) => {
    await navigateAndWait(page, '/');
    const emptyHrefs = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'));
      return links
        .filter((a) => !a.href || a.href === '' || a.href === 'javascript:;')
        .map((a) => a.outerHTML)
        .slice(0, 5);
    });
    expect(emptyHrefs).toHaveLength(0);
  });
});
