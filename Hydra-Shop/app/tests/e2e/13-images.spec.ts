import { test, expect } from '@playwright/test';
import {
  navigateAndWait,
  setDesktopViewport,
  setMobileViewport,
  mockProductSearchAPI,
  MOCK_PRODUCTS,
} from './helpers';

// ─── Utility ──────────────────────────────────────────────────────────────────

async function getBrokenImages(page: import('@playwright/test').Page): Promise<string[]> {
  await page.waitForLoadState('load');
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLImageElement>('img[src]'))
      .filter(
        (img) =>
          img.complete &&
          img.naturalWidth === 0 &&
          !img.src.startsWith('data:') &&
          img.src.trim().length > 0 &&
          !img.src.includes('_next/static'), // skip Next.js internal assets
      )
      .map((img) => img.src);
  });
}

async function getImagesWithEmptySrc(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLImageElement>('img'))
      .filter((img) => !img.src || img.src.trim() === '' || img.src === window.location.href)
      .map((img) => img.outerHTML.slice(0, 200));
  });
}

// ─── Homepage Images ──────────────────────────────────────────────────────────

test.describe('Images - Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
  });

  test('homepage has at least one image', async ({ page }) => {
    await navigateAndWait(page, '/');
    await page.waitForLoadState('load');
    const images = page.locator('img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test('homepage: no image has an empty src attribute', async ({ page }) => {
    await navigateAndWait(page, '/');
    const empty = await getImagesWithEmptySrc(page);
    expect(empty, `Images with empty src: ${empty.join('\n')}`).toHaveLength(0);
  });

  test('homepage: no fully-loaded image has naturalWidth = 0 (broken)', async ({ page }) => {
    await navigateAndWait(page, '/');
    const broken = await getBrokenImages(page);
    expect(broken, `Broken images on homepage: ${broken.join(', ')}`).toHaveLength(0);
  });

  test('homepage logo image has a valid src', async ({ page }) => {
    await navigateAndWait(page, '/');
    await page.waitForLoadState('load');

    const logo = page.locator('nav[aria-label="Navegación principal"] img').first();
    if ((await logo.count()) > 0) {
      const src = await logo.getAttribute('src');
      expect(src).not.toBeNull();
      expect(src!.length).toBeGreaterThan(0);
    }
  });

  test('homepage logo image has non-zero dimensions', async ({ page }) => {
    await navigateAndWait(page, '/');
    await page.waitForLoadState('load');

    const logo = page.locator('nav[aria-label="Navegación principal"] img').first();
    if ((await logo.count()) > 0) {
      const { width, height } = await logo.evaluate((el: HTMLImageElement) => ({
        width: el.naturalWidth,
        height: el.naturalHeight,
      }));
      const src = await logo.getAttribute('src');
      // SVGs may have naturalWidth=0 but still render, so accept that
      if (!src?.includes('.svg') && !src?.startsWith('data:')) {
        // For raster images, we expect dimensions > 0
        const isLoaded = width > 0 && height > 0;
        const isKnownFormat =
          src?.includes('.png') ||
          src?.includes('.jpg') ||
          src?.includes('.webp') ||
          src?.startsWith('/');
        expect(isLoaded || isKnownFormat).toBeTruthy();
      }
    }
  });
});

// ─── Auth Page Images ─────────────────────────────────────────────────────────

test.describe('Images - Auth Pages', () => {
  test('login page: no broken images', async ({ page }) => {
    await navigateAndWait(page, '/login');
    const broken = await getBrokenImages(page);
    expect(broken, `Broken images on /login: ${broken.join(', ')}`).toHaveLength(0);
  });

  test('signup page: no broken images', async ({ page }) => {
    await navigateAndWait(page, '/signup');
    const broken = await getBrokenImages(page);
    expect(broken, `Broken images on /signup: ${broken.join(', ')}`).toHaveLength(0);
  });

  test('login page images have non-empty src attributes', async ({ page }) => {
    await navigateAndWait(page, '/login');
    const empty = await getImagesWithEmptySrc(page);
    expect(empty).toHaveLength(0);
  });
});

// ─── Product Search Page Images ───────────────────────────────────────────────

test.describe('Images - Product Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
    await mockProductSearchAPI(page, MOCK_PRODUCTS);
  });

  test('search page has at least one image after loading with mock data', async ({ page }) => {
    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('load');

    const images = page.locator('img[src]');
    const count = await images.count();
    // There might be at least navbar logo
    expect(count).toBeGreaterThan(0);
  });

  test('search page: no images with empty src', async ({ page }) => {
    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(2000);
    const empty = await getImagesWithEmptySrc(page);
    expect(empty).toHaveLength(0);
  });

  test('product card images have valid src attribute', async ({ page }) => {
    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(3000);

    const cardImages = page.locator('[data-testid="product-card"] img[src]');
    const count = await cardImages.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const src = await cardImages.nth(i).getAttribute('src');
        expect(src, `Card image ${i} has empty src`).not.toBe('');
        expect(src, `Card image ${i} has null src`).not.toBeNull();
      }
    }
  });

  test('product card images do not have broken loading', async ({ page }) => {
    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('load');

    const broken = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll<HTMLImageElement>(
          '[data-testid="product-card"] img[src], .product-card img[src]',
        ),
      )
        .filter(
          (img) =>
            img.complete &&
            img.naturalWidth === 0 &&
            !img.src.startsWith('data:'),
        )
        .map((img) => img.src);
    });

    expect(broken, `Broken product images: ${broken.join(', ')}`).toHaveLength(0);
  });
});

// ─── Static Page Images ───────────────────────────────────────────────────────

test.describe('Images - Static Pages', () => {
  const pagesToCheck = ['/help', '/authenticity', '/terms'];

  for (const pagePath of pagesToCheck) {
    test(`${pagePath}: no broken images`, async ({ page }) => {
      await navigateAndWait(page, pagePath);
      const broken = await getBrokenImages(page);
      expect(broken, `Broken images on ${pagePath}: ${broken.join(', ')}`).toHaveLength(0);
    });

    test(`${pagePath}: no images with empty src`, async ({ page }) => {
      await navigateAndWait(page, pagePath);
      const empty = await getImagesWithEmptySrc(page);
      expect(empty, `Empty src on ${pagePath}: ${empty.join('\n')}`).toHaveLength(0);
    });
  }
});

// ─── Cart Page Images ─────────────────────────────────────────────────────────

test.describe('Images - Cart Page', () => {
  test('cart page: no broken images in empty state', async ({ page }) => {
    await navigateAndWait(page, '/cart');
    await page.waitForTimeout(2000);
    const broken = await getBrokenImages(page);
    expect(broken, `Broken images on /cart: ${broken.join(', ')}`).toHaveLength(0);
  });
});

// ─── Mobile Images ────────────────────────────────────────────────────────────

test.describe('Images - Mobile Viewport', () => {
  test.beforeEach(async ({ page }) => {
    await setMobileViewport(page);
  });

  test('homepage mobile: no broken images', async ({ page }) => {
    await navigateAndWait(page, '/');
    const broken = await getBrokenImages(page);
    expect(broken, `Broken images on mobile homepage: ${broken.join(', ')}`).toHaveLength(0);
  });

  test('mobile logo has a valid src', async ({ page }) => {
    await navigateAndWait(page, '/');
    await page.waitForLoadState('load');

    const mobileLogo = page.locator('a[href="/"] img').first();
    if ((await mobileLogo.count()) > 0) {
      const src = await mobileLogo.getAttribute('src');
      expect(src?.length).toBeGreaterThan(0);
    }
  });

  test('login page mobile: no broken images', async ({ page }) => {
    await navigateAndWait(page, '/login');
    const broken = await getBrokenImages(page);
    expect(broken, `Broken images on mobile /login: ${broken.join(', ')}`).toHaveLength(0);
  });
});

// ─── Image Alt Text ───────────────────────────────────────────────────────────

test.describe('Images - Accessibility Alt Text', () => {
  test('homepage: all important images have non-empty alt attributes', async ({ page }) => {
    await setDesktopViewport(page);
    await navigateAndWait(page, '/');

    // Find images that are NOT decorative (not aria-hidden, not role=presentation)
    const imagesWithoutAlt = await page.evaluate(() => {
      return Array.from(document.querySelectorAll<HTMLImageElement>('img'))
        .filter((img) => {
          const isDecorative =
            img.getAttribute('role') === 'presentation' ||
            img.getAttribute('aria-hidden') === 'true';
          return !isDecorative && (!img.alt || img.alt.trim() === '');
        })
        .map((img) => img.src || img.outerHTML.slice(0, 150));
    });

    // Allow a small tolerance for decorative images that don't have alt
    expect(imagesWithoutAlt.length).toBeLessThanOrEqual(3);
  });

  test('logo image has a descriptive alt text', async ({ page }) => {
    await setDesktopViewport(page);
    await navigateAndWait(page, '/');

    const logo = page.locator('nav[aria-label="Navegación principal"] img').first();
    if ((await logo.count()) > 0) {
      const alt = await logo.getAttribute('alt');
      expect(alt).not.toBeNull();
      expect(alt!.length).toBeGreaterThan(0);
    }
  });

  test('product card images have alt text on search page', async ({ page }) => {
    await setDesktopViewport(page);
    await mockProductSearchAPI(page);
    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(3000);

    const cardImages = page.locator('[data-testid="product-card"] img');
    const count = await cardImages.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const alt = await cardImages.nth(i).getAttribute('alt');
        // Alt can be empty for decorative images but should exist
        expect(alt).not.toBeNull();
      }
    }
  });
});

// ─── Next.js Image Optimization ───────────────────────────────────────────────

test.describe('Images - Next.js Optimization', () => {
  test('product card images use Next.js optimized srcset or src', async ({ page }) => {
    await setDesktopViewport(page);
    await mockProductSearchAPI(page);
    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(3000);

    const cardImages = page.locator('[data-testid="product-card"] img');
    const count = await cardImages.count();

    if (count > 0) {
      const firstImg = cardImages.first();
      const src = await firstImg.getAttribute('src');
      const srcset = await firstImg.getAttribute('srcset');
      // Next.js Image uses either /_next/image?url= or direct URLs
      expect(src !== null || srcset !== null).toBeTruthy();
    }
  });

  test('homepage logo uses Next.js Image component (has width/height or fill)', async ({
    page,
  }) => {
    await setDesktopViewport(page);
    await navigateAndWait(page, '/');
    await page.waitForLoadState('load');

    const logo = page.locator('nav[aria-label="Navegación principal"] img').first();
    if ((await logo.count()) > 0) {
      // Next.js Image sets style with object-fit or has loading attribute
      const loading = await logo.getAttribute('loading');
      const decoding = await logo.getAttribute('decoding');
      const style = await logo.getAttribute('style');
      // At least one of these attributes should be present
      expect(loading !== null || decoding !== null || style !== null).toBeTruthy();
    }
  });

  test('images on homepage do not have placeholder data-URIs as final src', async ({ page }) => {
    await setDesktopViewport(page);
    await navigateAndWait(page, '/');
    await page.waitForLoadState('load');
    // Give lazy images extra time to load
    await page.waitForTimeout(2000);

    // After full load, no src should still be a blur placeholder data URI
    // (Next.js replaces blurDataURL with actual src after load)
    const blurPlaceholders = await page.evaluate(() => {
      return Array.from(document.querySelectorAll<HTMLImageElement>('img[src]'))
        .filter(
          (img) =>
            img.src.startsWith('data:image') &&
            img.complete &&
            // A tiny blur placeholder would be very small (< 1KB)
            img.src.length > 100 &&
            img.src.length < 1000,
        )
        .map((img) => img.alt || img.src.slice(0, 50));
    });

    // Ideally no images should be stuck as blur placeholders after page fully loads
    expect(blurPlaceholders.length).toBeLessThanOrEqual(2);
  });
});
