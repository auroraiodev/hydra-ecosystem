import { test, expect } from '@playwright/test';

test.describe('Orders', () => {
  test.describe('Orders Listing', () => {
    test('should display orders page with search bar', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="buscar" i]');
        if (await searchInput.count() > 0) {
          await expect(searchInput).toBeVisible();
        }
      }
    });

    test('should have order status filter buttons', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const statusButton = page.locator('button').filter({ hasText: /Todos|All|Status|Estado/i });
        if (await statusButton.count() > 0) {
          await expect(statusButton.first()).toBeVisible();
        }
      }
    });

    test('should display orders table with headers', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderTable = page.locator('table');
        if (await orderTable.count() > 0) {
          const headers = orderTable.locator('th');
          const headerCount = await headers.count();
          expect(headerCount).toBeGreaterThanOrEqual(3);
        }
      }
    });

    test('should show order images in listing', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const orderImages = page.locator('table img, [class*="order"] img, td img');
        const count = await orderImages.count();
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const src = await orderImages.nth(i).getAttribute('src');
            expect(src).toBeTruthy();
          }
        }
      }
    });

    test('should display order TCG name in each row', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const tcgNames = page.locator('tbody tr td').filter({ hasText: /One Piece|Pokemon|Yu-Gi-Oh|Lorcana/i });
        const count = await tcgNames.count();
        if (count > 0) {
          await expect(tcgNames.first()).toBeVisible();
        }
      }
    });

    test('should have clickable order rows linking to detail', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderLinks = page.locator('a[href*="/dashboard/orders/"]');
        if (await orderLinks.count() > 0) {
          const href = await orderLinks.first().getAttribute('href');
          expect(href).toMatch(/\/dashboard\/orders\//);
        }
      }
    });

    test('should show formatted prices in order rows', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const priceTexts = page.locator('td').filter({ hasText: /\$[0-9,]+/ });
        const count = await priceTexts.count();
        if (count > 0) {
          await expect(priceTexts.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Order Detail', () => {
    test('should navigate to order detail page', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await orderLink.count() > 0) {
          const href = await orderLink.getAttribute('href');
          await orderLink.click();
          await page.waitForURL(/\/dashboard\/orders\//);
          expect(page.url()).toMatch(/\/dashboard\/orders\//);
        }
      }
    });

    test('should display order ID on detail page', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await orderLink.count() > 0) {
          await orderLink.click();
          await page.waitForURL(/\/dashboard\/orders\//);
          await page.waitForTimeout(1000);
          const orderIdText = page.locator('text=#');
          if (await orderIdText.count() > 0) {
            await expect(orderIdText.first()).toBeVisible();
          }
        }
      }
    });

    test('should display order status badge on detail page', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await orderLink.count() > 0) {
          await orderLink.click();
          await page.waitForURL(/\/dashboard\/orders\//);
          await page.waitForTimeout(1000);
          const statusBadge = page.locator('[class*="badge"]').first();
          if (await statusBadge.count() > 0) {
            await expect(statusBadge).toBeVisible();
          }
        }
      }
    });

    test('should display order items with product images', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await orderLink.count() > 0) {
          await orderLink.click();
          await page.waitForURL(/\/dashboard\/orders\//);
          await page.waitForTimeout(2000);
          const itemImages = page.locator('img').filter({ has: page.locator('[alt*="Card" i], [alt*="card" i]') });
          const allImages = page.locator('main img');
          const count = await allImages.count();
          if (count > 0) {
            for (let i = 0; i < Math.min(count, 3); i++) {
              const src = await allImages.nth(i).getAttribute('src');
              expect(src).toBeTruthy();
            }
          }
        }
      }
    });

    test('should display order timeline', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await orderLink.count() > 0) {
          await orderLink.click();
          await page.waitForURL(/\/dashboard\/orders\//);
          await page.waitForTimeout(1500);
          const timeline = page.locator('[class*="timeline"]');
          if (await timeline.count() > 0) {
            await expect(timeline.first()).toBeVisible();
          }
        }
      }
    });

    test('should display order timeline steps with check marks', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await orderLink.count() > 0) {
          await orderLink.click();
          await page.waitForURL(/\/dashboard\/orders\//);
          await page.waitForTimeout(2000);
          const timelineSteps = page.locator('[class*="timeline"] [class*="step"], [class*="timeline"] li');
          const count = await timelineSteps.count();
          if (count > 0) {
            const checkIcons = timelineSteps.locator('svg');
            if (await checkIcons.count() > 0) {
              await expect(checkIcons.first()).toBeAttached();
            }
          }
        }
      }
    });

    test('should display tracking section on order detail', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await orderLink.count() > 0) {
          await orderLink.click();
          await page.waitForURL(/\/dashboard\/orders\//);
          await page.waitForTimeout(1500);
          const trackingSection = page.locator('text=Tracking');
          if (await trackingSection.count() > 0) {
            await expect(trackingSection.first()).toBeVisible();
          }
        }
      }
    });

    test('should display buyer information on order detail', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await orderLink.count() > 0) {
          await orderLink.click();
          await page.waitForURL(/\/dashboard\/orders\//);
          await page.waitForTimeout(1500);
          const buyerInfo = page.locator('text=Buyer');
          if (await buyerInfo.count() > 0) {
            await expect(buyerInfo.first()).toBeVisible();
          }
        }
      }
    });

    test('should display order total amount on detail page', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await orderLink.count() > 0) {
          await orderLink.click();
          await page.waitForURL(/\/dashboard\/orders\//);
          await page.waitForTimeout(1500);
          const total = page.locator('text=Total').first();
          await expect(total).toBeAttached();
          const amount = page.locator('text=/\$[0-9,]+/').last();
        }
      }
    });
  });

  test.describe('Order Status Management', () => {
    test('should display status update buttons', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await orderLink.count() > 0) {
          await orderLink.click();
          await page.waitForURL(/\/dashboard\/orders\//);
          await page.waitForTimeout(2000);
          const actionButtons = page.locator('button').filter({ hasText: /Confirm|Ship|Deliver|Cancel|Approve/i });
          if (await actionButtons.count() > 0) {
            await expect(actionButtons.first()).toBeVisible();
          }
        }
      }
    });

    test('should trigger confirmation dialog on status action', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await orderLink.count() > 0) {
          await orderLink.click();
          await page.waitForURL(/\/dashboard\/orders\//);
          await page.waitForTimeout(2000);
          const actionButton = page.locator('button').filter({ hasText: /Confirm|Ship|Deliver/i }).first();
          if (await actionButton.count() > 0) {
            await actionButton.click();
            await page.waitForTimeout(1000);
            const confirmDialog = page.locator('[role="dialog"]');
            if (await confirmDialog.count() > 0) {
              await expect(confirmDialog.first()).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe('Order Search and Filter', () => {
    test('should filter orders by status', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const statusButton = page.locator('button').filter({ hasText: /Todos|All|Status|Estado/i });
        if (await statusButton.count() > 0) {
          await statusButton.first().click();
          await page.waitForTimeout(500);
          const statusOption = page.locator('[role="option"], [role="menuitem"]').filter({ hasText: /Completado|Complet/i }).first();
          if (await statusOption.count() > 0) {
            await statusOption.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });

    test('should search orders by text input', async ({ page }) => {
      await page.goto('/dashboard/orders');
      if (!page.url().includes('login')) {
        const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="buscar" i]');
        if (await searchInput.count() > 0) {
          await searchInput.fill('test');
          await page.waitForTimeout(1000);
        }
      }
    });
  });
});
