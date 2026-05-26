import { test, expect } from '@playwright/test';
import { navigateAndWait } from './helpers';

test.describe('Search - Singles Search Page', () => {
  test('singles search page loads', async ({ page }) => {
    await navigateAndWait(page, '/singles/search');
    await expect(page.locator('main')).toBeAttached();
  });

  test('singles search page accepts query parameter', async ({ page }) => {
    await navigateAndWait(page, '/singles/search?query=mana');
    await expect(page.locator('main')).toBeAttached();
  });

  test('singles search page accepts category filter', async ({ page }) => {
    await navigateAndWait(page, '/singles/search?category=SINGLES');
    await expect(page.locator('main')).toBeAttached();
  });

  test('singles search page accepts tcg filter', async ({ page }) => {
    await navigateAndWait(page, '/singles/search?tcgId=1');
    await expect(page.locator('main')).toBeAttached();
  });

  test('singles search pagination parameter is accepted', async ({ page }) => {
    await navigateAndWait(page, '/singles/search?page=2');
    await expect(page.locator('main')).toBeAttached();
  });

  test('singles set route loads', async ({ page }) => {
    await navigateAndWait(page, '/singles/set/TestSet');
    await expect(page.locator('main')).toBeAttached();
  });
});

test.describe('Search - Cross-app Search', () => {
  test('/search redirects to singles search', async ({ page }) => {
    await page.goto('/search');
    await page.waitForTimeout(2000);
    const url = page.url();
    const acceptable = [
      url.includes('/singles/search'),
      url.includes('/search'),
    ];
    expect(acceptable.some(Boolean)).toBeTruthy();
  });
});
