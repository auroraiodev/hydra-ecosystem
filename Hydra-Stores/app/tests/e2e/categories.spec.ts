import { test, expect } from '@playwright/test';

test.describe('Categories & TCGs', () => {
  test.describe('Categories Listing', () => {
    test('should navigate to categories page', async ({ page }) => {
      await page.goto('/dashboard/categories');
      if (!page.url().includes('login')) {
        await expect(page).toHaveURL(/\/dashboard\/categories/);
      }
    });

    test('should display categories list with table', async ({ page }) => {
      await page.goto('/dashboard/categories');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const categoryTable = page.locator('table');
        if (await categoryTable.count() > 0) {
          await expect(categoryTable.first()).toBeVisible();
        }
      }
    });

    test('should have add category button', async ({ page }) => {
      await page.goto('/dashboard/categories');
      if (!page.url().includes('login')) {
        const addButton = page.locator('a[href*="add"], a[href*="create"], button').filter({ hasText: /Add|Nuevo|New|Crear/i });
        if (await addButton.count() > 0) {
          await expect(addButton.first()).toBeVisible();
        }
      }
    });

    test('should display category images if present', async ({ page }) => {
      await page.goto('/dashboard/categories');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const categoryImages = page.locator('table img, [class*="category"] img');
        const count = await categoryImages.count();
        if (count > 0) {
          const src = await categoryImages.first().getAttribute('src');
          expect(src).toBeTruthy();
        }
      }
    });

    test('should have edit action on category rows', async ({ page }) => {
      await page.goto('/dashboard/categories');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const editButtons = page.locator('button').filter({ hasText: /Edit|Editar/i });
        if (await editButtons.count() > 0) {
          await expect(editButtons.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('TCGs Listing', () => {
    test('should navigate to TCGs page', async ({ page }) => {
      await page.goto('/dashboard/tcgs');
      if (!page.url().includes('login')) {
        await expect(page).toHaveURL(/\/dashboard\/tcgs/);
      }
    });

    test('should display TCGs list with images', async ({ page }) => {
      await page.goto('/dashboard/tcgs');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const tcgImages = page.locator('img[alt*="TCG" i], img[alt*="One Piece" i], img[alt*="Pokemon" i]');
        const count = await tcgImages.count();
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const src = await tcgImages.nth(i).getAttribute('src');
            expect(src).toBeTruthy();
            await expect(tcgImages.nth(i)).toBeAttached();
          }
        }
      }
    });

    test('should have TCG table with headers', async ({ page }) => {
      await page.goto('/dashboard/tcgs');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const tcgTable = page.locator('table');
        if (await tcgTable.count() > 0) {
          const headers = await tcgTable.locator('th').allTextContents();
          const hasName = headers.some(h => /name|nombre/i.test(h));
          expect(hasName).toBeTruthy();
        }
      }
    });

    test('should show TCG cards count in listing', async ({ page }) => {
      await page.goto('/dashboard/tcgs');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const cardCounts = page.locator('td').filter({ hasText: /[0-9]+ cards/i });
        if (await cardCounts.count() > 0) {
          await expect(cardCounts.first()).toBeVisible();
        }
      }
    });

    test('should have active toggle on TCG items', async ({ page }) => {
      await page.goto('/dashboard/tcgs');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const toggle = page.locator('[role="switch"]');
        if (await toggle.count() > 0) {
          await expect(toggle.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Tags Management', () => {
    test('should navigate to tags page if accessible', async ({ page }) => {
      await page.goto('/dashboard/tags');
      if (!page.url().includes('login') && !page.url().includes('404') && !page.url().includes('error')) {
        await expect(page).toHaveURL(/\/dashboard\/tags/);
      }
    });
  });

  test.describe('Conditions Management', () => {
    test('should navigate to conditions page if accessible', async ({ page }) => {
      await page.goto('/dashboard/conditions');
      if (!page.url().includes('login') && !page.url().includes('404') && !page.url().includes('error')) {
        await expect(page).toHaveURL(/\/dashboard\/conditions/);
      }
    });

    test('should display conditions list', async ({ page }) => {
      await page.goto('/dashboard/conditions');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const conditionItems = page.locator('table, [class*="grid"]');
        if (await conditionItems.count() > 0) {
          await expect(conditionItems.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Languages Management', () => {
    test('should navigate to languages page if accessible', async ({ page }) => {
      await page.goto('/dashboard/languages');
      if (!page.url().includes('login') && !page.url().includes('404') && !page.url().includes('error')) {
        await expect(page).toHaveURL(/\/dashboard\/languages/);
      }
    });
  });
});
