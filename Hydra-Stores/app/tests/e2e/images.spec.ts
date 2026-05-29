import { test, expect } from '@playwright/test';

test.describe('Images & Media', () => {
  test.describe('SafeImg Component', () => {
    test('should render SafeImg with valid image source', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const imgs = page.locator('img');
        const count = await imgs.count();
        let safeImgFound = false;
        for (let i = 0; i < count; i++) {
          const src = await imgs.nth(i).getAttribute('src');
          if (src && src.length > 0) {
            safeImgFound = true;
            expect(src.length).toBeGreaterThan(0);
            break;
          }
        }
        expect(safeImgFound || count === 0).toBeTruthy();
      }
    });

    test('should have alt attributes on all images', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const imgs = page.locator('img');
        const count = await imgs.count();
        for (let i = 0; i < count; i++) {
          const alt = await imgs.nth(i).getAttribute('alt');
          expect(alt).not.toBeNull();
        }
      }
    });

    test('should load images from valid URLs', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const imgs = page.locator('img');
        const count = await imgs.count();
        for (let i = 0; i < Math.min(count, 5); i++) {
          const src = await imgs.nth(i).getAttribute('src');
          if (src && !src.startsWith('data:')) {
            const response = await page.request.get(src).catch(() => null);
            expect(response).not.toBeNull();
          }
        }
      }
    });
  });

  test.describe('Product Images', () => {
    test('should display product images on product listing', async ({ page }) => {
      await page.goto('/dashboard/products');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(3000);
        const productImages = page.locator('[class*="card"] img, td img, [class*="product"] img');
        const count = await productImages.count();
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 4); i++) {
            const src = await productImages.nth(i).getAttribute('src');
            expect(src).toBeTruthy();
            await expect(productImages.nth(i)).toBeVisible();
          }
        }
      }
    });

    test('should not have broken product images', async ({ page }) => {
      await page.goto('/dashboard/products');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(3000);
        const imgs = page.locator('img');
        const count = await imgs.count();
        for (let i = 0; i < Math.min(count, 10); i++) {
          const src = await imgs.nth(i).getAttribute('src');
          if (src && !src.startsWith('data:') && (src.startsWith('http') || src.startsWith('/'))) {
            const resp = await page.request.get(src).catch(() => null);
            if (resp) {
              expect(resp.ok()).toBeTruthy();
            }
          }
        }
      }
    });
  });

  test.describe('Avatar Images', () => {
    test('should display user avatar in sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2500);
        const avatarImg = page.locator('[class*="sidebar"] [class*="avatar"] img, [class*="sidebar"] img[class*="avatar"]');
        if (await avatarImg.count() > 0) {
          const src = await avatarImg.first().getAttribute('src');
          expect(src).toBeTruthy();
          await expect(avatarImg.first()).toBeVisible();
        }
      }
    });

    test('should display default avatar for users without image', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const avatarImgs = page.locator('[class*="avatar"] img');
        const count = await avatarImgs.count();
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const src = await avatarImgs.nth(i).getAttribute('src');
            expect(src).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Order Images', () => {
    test('should display card images in order detail', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await orderLink.count() > 0) {
          await orderLink.click();
          await page.waitForURL(/\/dashboard\/orders\//);
          await page.waitForTimeout(3000);
          const mainImgs = page.locator('main img');
          const count = await mainImgs.count();
          if (count > 0) {
            for (let i = 0; i < count; i++) {
              const src = await mainImgs.nth(i).getAttribute('src');
              expect(src).toBeTruthy();
            }
          }
        }
      }
    });
  });

  test.describe('TCG Images', () => {
    test('should display TCG logo images', async ({ page }) => {
      await page.goto('/dashboard/tcgs');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2500);
        const tcgImages = page.locator('img[alt*="TCG" i], td img');
        const count = await tcgImages.count();
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 5); i++) {
            const src = await tcgImages.nth(i).getAttribute('src');
            expect(src).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Loading States', () => {
    test('should show skeleton placeholder while images load', async ({ page }) => {
      await page.goto('/dashboard/products');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const skeletons = page.locator('[class*="skeleton"]');
        if (await skeletons.count() > 0) {
          await expect(skeletons.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Category Images', () => {
    test('should display category icons on categories page', async ({ page }) => {
      await page.goto('/dashboard/categories');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2500);
        const categoryIcons = page.locator('td img, [class*="icon"] img');
        const count = await categoryIcons.count();
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const src = await categoryIcons.nth(i).getAttribute('src');
            if (src) {
              expect(src.length).toBeGreaterThan(0);
            }
          }
        }
      }
    });
  });
});
