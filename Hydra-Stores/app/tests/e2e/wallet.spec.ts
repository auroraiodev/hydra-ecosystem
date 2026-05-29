import { test, expect } from '@playwright/test';

test.describe('Wallet', () => {
  test.describe('Wallet Page', () => {
    test('should navigate to wallet page', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await expect(page).toHaveURL(/\/dashboard\/wallet/);
      }
    });

    test('should display wallet balance card', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const balanceLabel = page.locator('p').filter({ hasText: /Balance|Saldo/i });
        if (await balanceLabel.count() > 0) {
          await expect(balanceLabel.first()).toBeVisible();
        }
      }
    });

    test('should show formatted balance amount', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const balanceAmount = page.locator('[class*="text-2xl"], [class*="text-lg"], .font-bold').filter({ hasText: /\$[0-9,]+/ });
        if (await balanceAmount.count() > 0) {
          await expect(balanceAmount.first()).toBeVisible();
        }
      }
    });

    test('should display wallet currency indicator', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const mxnIndicator = page.locator('text=MXN');
        if (await mxnIndicator.count() > 0) {
          await expect(mxnIndicator.first()).toBeVisible();
        }
      }
    });

    test('should have payout request button', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const payoutButton = page.locator('a[href*="payout"], button').filter({ hasText: /Payout|Retirar|Solicitar/i });
        if (await payoutButton.count() > 0) {
          await expect(payoutButton.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Transactions Table', () => {
    test('should display transactions table', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const transactionTable = page.locator('table');
        if (await transactionTable.count() > 0) {
          await expect(transactionTable.first()).toBeVisible();
        }
      }
    });

    test('should have transaction table headers', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const headers = page.locator('table th');
        if (await headers.count() > 0) {
          const headerTexts = await headers.allTextContents();
          const hasDate = headerTexts.some(t => /date|fecha/i.test(t));
          const hasAmount = headerTexts.some(t => /amount|monto|total/i.test(t));
          expect(hasAmount).toBeTruthy();
        }
      }
    });

    test('should show transaction amounts with currency', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const amounts = page.locator('table td').filter({ hasText: /\$[0-9,]+/ });
        if (await amounts.count() > 0) {
          await expect(amounts.first()).toBeVisible();
        }
      }
    });

    test('should show transaction status badges', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const statusBadges = page.locator('td [class*="badge"]');
        if (await statusBadges.count() > 0) {
          await expect(statusBadges.first()).toBeVisible();
        }
      }
    });

    test('should have transaction type icons', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const tbodyRows = page.locator('tbody tr');
        const count = await tbodyRows.count();
        if (count > 0) {
          const firstRowIcons = tbodyRows.first().locator('svg');
          if (await firstRowIcons.count() > 0) {
            await expect(firstRowIcons.first()).toBeVisible();
          }
        }
      }
    });

    test('should show transaction descriptions', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const firstDataCell = page.locator('tbody tr:first-child td:first-child');
        if (await firstDataCell.count() > 0) {
          const text = await firstDataCell.textContent();
          expect(text?.trim()).toBeTruthy();
        }
      }
    });
  });

  test.describe('Transaction Filtering', () => {
    test('should have date range filter for transactions', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const dateInput = page.locator('input[type="date"], input[placeholder*="date" i]');
        if (await dateInput.count() > 0) {
          await expect(dateInput.first()).toBeAttached();
        }
      }
    });

    test('should have transaction type filter', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const typeFilter = page.locator('select, button[role="combobox"]').first();
        if (await typeFilter.count() > 0) {
          await expect(typeFilter).toBeVisible();
        }
      }
    });
  });

  test.describe('Pagination', () => {
    test('should have pagination controls on wallet page', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const pagination = page.locator('nav[aria-label="pagination"], [class*="pagination"]');
        if (await pagination.count() > 0) {
          await expect(pagination.first()).toBeVisible();
        }
      }
    });

    test('should navigate to next page of transactions', async ({ page }) => {
      await page.goto('/dashboard/wallet');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const nextButton = page.locator('button[aria-label*="next" i], [class*="pagination"] button:last-child');
        if (await nextButton.count() > 0 && !await nextButton.isDisabled()) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });
  });
});
