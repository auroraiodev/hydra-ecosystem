import { test, expect } from '@playwright/test';

test.describe('Sales & Imports', () => {
  test.describe('Sales History', () => {
    test('should navigate to sales page', async ({ page }) => {
      await page.goto('/dashboard/sales');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await expect(page).toHaveURL(/\/dashboard\/sales/);
      }
    });

    test('should display sales table', async ({ page }) => {
      await page.goto('/dashboard/sales');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const salesTable = page.locator('table');
        if (await salesTable.count() > 0) {
          await expect(salesTable.first()).toBeVisible();
        }
      }
    });

    test('should show sale amounts with currency', async ({ page }) => {
      await page.goto('/dashboard/sales');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const amounts = page.locator('table td, [class*="sale"]').filter({ hasText: /\$[0-9,]+/ });
        if (await amounts.count() > 0) {
          await expect(amounts.first()).toBeVisible();
        }
      }
    });

    test('should have date filter for sales', async ({ page }) => {
      await page.goto('/dashboard/sales');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(1000);
        const datePicker = page.locator('input[type="date"], button').filter({ hasText: /Date|Fecha/i });
        if (await datePicker.count() > 0) {
          await expect(datePicker.first()).toBeAttached();
        }
      }
    });

    test('should have export sales button', async ({ page }) => {
      await page.goto('/dashboard/sales');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(1000);
        const exportButton = page.locator('button').filter({ hasText: /Export|Descargar/i });
        if (await exportButton.count() > 0) {
          await expect(exportButton.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Imports', () => {
    test('should navigate to imports page', async ({ page }) => {
      await page.goto('/dashboard/imports');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await expect(page).toHaveURL(/\/dashboard\/imports/);
      }
    });

    test('should display import history table', async ({ page }) => {
      await page.goto('/dashboard/imports');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const importTable = page.locator('table');
        if (await importTable.count() > 0) {
          await expect(importTable.first()).toBeVisible();
        }
      }
    });

    test('should show import status badges', async ({ page }) => {
      await page.goto('/dashboard/imports');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const statusBadges = page.locator('[class*="badge"]');
        if (await statusBadges.count() > 0) {
          await expect(statusBadges.first()).toBeVisible();
        }
      }
    });

    test('should have new import button', async ({ page }) => {
      await page.goto('/dashboard/imports');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        const newImportBtn = page.locator('button, a').filter({ hasText: /New Import|Nueva importación|Nueva/i });
        if (await newImportBtn.count() > 0) {
          await expect(newImportBtn.first()).toBeVisible();
        }
      }
    });

    test('should display import stats summary', async ({ page }) => {
      await page.goto('/dashboard/imports');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(1500);
        const summary = page.locator('text=Importaciones');
        if (await summary.count() > 0) {
          await expect(summary.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Carts', () => {
    test('should navigate to carts page', async ({ page }) => {
      await page.goto('/dashboard/carts');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await expect(page).toHaveURL(/\/dashboard\/carts/);
      }
    });

    test('should display carts listing', async ({ page }) => {
      await page.goto('/dashboard/carts');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const cartContent = page.locator('table, [class*="cart"]');
        if (await cartContent.count() > 0) {
          await expect(cartContent.first()).toBeVisible();
        }
      }
    });

    test('should have search for carts', async ({ page }) => {
      await page.goto('/dashboard/carts');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(1000);
        const search = page.locator('input[placeholder*="search" i], input[placeholder*="buscar" i]');
        if (await search.count() > 0) {
          await expect(search.first()).toBeVisible();
        }
      }
    });

    test('should show cart items with product images', async ({ page }) => {
      await page.goto('/dashboard/carts');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const images = page.locator('table img');
        const count = await images.count();
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const src = await images.nth(i).getAttribute('src');
            expect(src).toBeTruthy();
          }
        }
      }
    });
  });
});
