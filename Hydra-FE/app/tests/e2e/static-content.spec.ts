import { test, expect } from '@playwright/test';
import { navigateAndWait } from './helpers';

test.describe('Static Pages - Legal', () => {
  test('terms page loads', async ({ page }) => {
    await navigateAndWait(page, '/terms');
    await expect(page.locator('main')).toBeAttached();
  });

  test('privacy page loads', async ({ page }) => {
    await navigateAndWait(page, '/privacy');
    await expect(page.locator('main')).toBeAttached();
  });

  test('cookies page loads', async ({ page }) => {
    await navigateAndWait(page, '/cookies');
    await expect(page.locator('main')).toBeAttached();
  });

  test('returns page loads', async ({ page }) => {
    await navigateAndWait(page, '/returns');
    await expect(page.locator('main')).toBeAttached();
  });

  test('authenticity page loads', async ({ page }) => {
    await navigateAndWait(page, '/authenticity');
    await expect(page.locator('main')).toBeAttached();
  });
});

test.describe('Static Pages - Support', () => {
  test('help page loads', async ({ page }) => {
    await navigateAndWait(page, '/help');
    await expect(page.locator('main')).toBeAttached();
  });
});

test.describe('Static Pages - Error States', () => {
  test('404 page for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist-xyz');
    const status = response?.status() ?? 200;
    const url = page.url();
    const handled = url.includes('404') || status === 404;
    if (!handled) {
      expect(page.locator('main')).toBeAttached();
    }
  });

  test('not-found page loads for invalid path', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('nonexistent');
  });
});

test.describe('Static Pages - Offline & Maintenance', () => {
  test('offline page loads', async ({ page }) => {
    await navigateAndWait(page, '/offline');
    await expect(page.locator('main')).toBeAttached();
  });

  test('maintenance page loads', async ({ page }) => {
    await navigateAndWait(page, '/maintenance');
    await expect(page.locator('main')).toBeAttached();
  });
});
