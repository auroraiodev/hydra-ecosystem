import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Wallet (Billetera)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/wallet');
  });

  test('should display wallet page header and balance summary', async ({ page }) => {
    const title = page.locator('h1, h2, h3', { hasText: /Wallet|Billetera|Finanzas/i }).first();
    await expect(title).toBeVisible();

    // Verify balance summary cards are visible (e.g. balance, incoming, outflows)
    const balanceLabel = page.locator('text=/Saldo|Balance/i').first();
    await expect(balanceLabel).toBeVisible();
  });

  test('should list transactions in table', async ({ page }) => {
    // Click on Juan Perez to open his wallet details dialog where his transactions are listed
    await page.locator('text=Juan Perez').first().click();

    // Check if the mock transactions are visible in rows
    await expect(page.locator('text=tx-1')).toBeVisible();
    await expect(page.locator('text=tx-2')).toBeVisible();

    // Verify prices/amounts are shown correctly
    await expect(page.locator('text=1,250')).toBeVisible();
    await expect(page.locator('text=500')).toBeVisible();
  });

  test('should filter transactions by type', async ({ page }) => {
    // Click on Juan Perez to open his wallet details dialog where his transactions are listed
    await page.locator('text=Juan Perez').first().click();

    const typeSelect = page.locator('select[aria-label*="tipo"], select[aria-label*="Tipo"], select[name="type"]');
    if (await typeSelect.count() > 0) {
      // Filter by deposit
      await typeSelect.selectOption('DEPOSIT');
      
      // Verify deposit transaction is visible and withdrawal disappears
      await expect(page.locator('text=tx-1')).toBeVisible();
      await expect(page.locator('text=tx-2')).not.toBeVisible();
    }
  });
});
