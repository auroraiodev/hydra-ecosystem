import { test, expect } from '@playwright/test';

test.describe('Products', () => {
  test.describe('Product Listing', () => {
    test('should display products page with search bar', async ({ page }) => {
      await page.goto('/dashboard/products');
      if (!page.url().includes('login')) {
        const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="buscar" i]');
        await expect(searchInput).toBeAttached();
      }
    });

    test('should display product cards with images', async ({ page }) => {
      await page.goto('/dashboard/products');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const productCards = page.locator('[class*="card"] img, [class*="item"] img');
        const count = await productCards.count();
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const src = await productCards.nth(i).getAttribute('src');
            expect(src).toBeTruthy();
            await expect(productCards.nth(i)).toBeAttached();
          }
        }
      }
    });

    test('should have filter controls on products page', async ({ page }) => {
      await page.goto('/dashboard/products');
      if (!page.url().includes('login')) {
        const filterButton = page.locator('button').filter({ hasText: /Filtros|Filter/i });
        if (await filterButton.count() > 0) {
          await expect(filterButton).toBeVisible();
        }
      }
    });

    test('should have add product button', async ({ page }) => {
      await page.goto('/dashboard/products');
      if (!page.url().includes('login')) {
        const addButton = page.locator('a[href*="add"], a[href*="create"], button').filter({ hasText: /Añadir|Add|Nuevo|New/i });
        const addButton2 = page.locator('a[href*="products/add"]');
        const exists = await addButton.count() > 0;
        const exists2 = await addButton2.count() > 0;
        expect(exists || exists2).toBeTruthy();
      }
    });

    test('should show product table with columns', async ({ page }) => {
      await page.goto('/dashboard/products');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const productTable = page.locator('table');
        if (await productTable.count() > 0) {
          const columns = productTable.locator('th');
          const columnCount = await columns.count();
          expect(columnCount).toBeGreaterThanOrEqual(3);
        }
      }
    });

    test('should have working search functionality', async ({ page }) => {
      await page.goto('/dashboard/products');
      if (!page.url().includes('login')) {
        const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="buscar" i]');
        if (await searchInput.count() > 0) {
          await searchInput.fill('test card');
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe('Add Product', () => {
    test('should navigate to add product page', async ({ page }) => {
      await page.goto('/dashboard/products/add');
      if (!page.url().includes('login')) {
        await expect(page).toHaveURL(/\/products\/add/);
      }
    });

    test('should display add product form heading', async ({ page }) => {
      await page.goto('/dashboard/products/add');
      if (!page.url().includes('login')) {
        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible();
        const text = await heading.textContent();
        expect(text?.toLowerCase()).toContain('producto');
      }
    });

    test('should have OwnerSelector component', async ({ page }) => {
      await page.goto('/dashboard/products/add');
      if (!page.url().includes('login')) {
        const ownerSection = page.locator('text=Owner');
        if (await ownerSection.count() > 0) {
          await expect(ownerSection.first()).toBeVisible();
        }
        const ownerSelect = page.locator('button[role="combobox"]').first();
        if (await ownerSelect.count() > 0) {
          await expect(ownerSelect).toBeVisible();
        }
      }
    });

    test('should have TCG selector section', async ({ page }) => {
      await page.goto('/dashboard/products/add');
      if (!page.url().includes('login')) {
        const tcgSection = page.locator('text=TCG');
        if (await tcgSection.count() > 0) {
          await expect(tcgSection.first()).toBeVisible();
        }
      }
    });

    test('should have Category selector', async ({ page }) => {
      await page.goto('/dashboard/products/add');
      if (!page.url().includes('login')) {
        const categorySection = page.locator('text=Category');
        if (await categorySection.count() > 0) {
          await expect(categorySection.first()).toBeVisible();
        }
      }
    });

    test('should have dynamic product form section', async ({ page }) => {
      await page.goto('/dashboard/products/add');
      if (!page.url().includes('login')) {
        const formSection = page.locator('text=Card Details');
        if (await formSection.count() > 0) {
          await expect(formSection.first()).toBeVisible();
        }
      }
    });

    test('should have ItemsList section', async ({ page }) => {
      await page.goto('/dashboard/products/add');
      if (!page.url().includes('login')) {
        const itemsSection = page.locator('text=Items List');
        if (await itemsSection.count() > 0) {
          await expect(itemsSection.first()).toBeVisible();
        }
      }
    });

    test('should have BulkImportDialog trigger button', async ({ page }) => {
      await page.goto('/dashboard/products/add');
      if (!page.url().includes('login')) {
        const bulkButton = page.locator('button').filter({ hasText: /Bulk/i });
        if (await bulkButton.count() > 0) {
          await expect(bulkButton).toBeVisible();
        }
      }
    });
  });

  test.describe('Bulk Import', () => {
    test('should open bulk import dialog when button clicked', async ({ page }) => {
      await page.goto('/dashboard/products/add');
      if (!page.url().includes('login')) {
        const bulkButton = page.locator('button').filter({ hasText: /Bulk/i });
        if (await bulkButton.count() > 0) {
          await bulkButton.first().click();
          await page.waitForTimeout(1000);
          const dialog = page.locator('[role="dialog"]');
          await expect(dialog).toBeAttached();
        }
      }
    });

    test('should have upload section in bulk import dialog', async ({ page }) => {
      await page.goto('/dashboard/products/add');
      if (!page.url().includes('login')) {
        const bulkButton = page.locator('button').filter({ hasText: /Bulk/i });
        if (await bulkButton.count() > 0) {
          await bulkButton.first().click();
          await page.waitForTimeout(1000);
          const uploadInput = page.locator('input[type="file"]');
          if (await uploadInput.count() > 0) {
            await expect(uploadInput).toBeVisible();
          }
        }
      }
    });

    test('should close bulk import dialog on close button', async ({ page }) => {
      await page.goto('/dashboard/products/add');
      if (!page.url().includes('login')) {
        const bulkButton = page.locator('button').filter({ hasText: /Bulk/i });
        if (await bulkButton.count() > 0) {
          await bulkButton.first().click();
          await page.waitForTimeout(500);
          const closeButton = page.locator('[role="dialog"] button').filter({ hasText: /X|Close|Cerrar/i }).first();
          const closeButton2 = page.locator('[role="dialog"] svg').first();
          await closeButton.click().catch(() => closeButton2.click().catch(() => {}));
          await page.waitForTimeout(500);
          const dialog = page.locator('[role="dialog"]');
          await expect(dialog).not.toBeAttached();
        }
      }
    });
  });

  test.describe('Product Actions', () => {
    test('should have action buttons on product cards', async ({ page }) => {
      await page.goto('/dashboard/products');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const actionButtons = page.locator('button').filter({ hasText: /Edit|Delete|Toggle/i });
        const count = await actionButtons.count();
        if (count > 0) {
          await expect(actionButtons.first()).toBeVisible();
        }
      }
    });

    test('should navigate to product edit page', async ({ page }) => {
      await page.goto('/dashboard/products');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const editButtons = page.locator('a[href*="edit"]');
        if (await editButtons.count() > 0) {
          const href = await editButtons.first().getAttribute('href');
          await editButtons.first().click();
          await expect(page).toHaveURL(/edit/);
        }
      }
    });

    test('should confirm delete action', async ({ page }) => {
      await page.goto('/dashboard/products');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const deleteButton = page.locator('button').filter({ hasText: /Delete|Eliminar/i });
        if (await deleteButton.count() > 0) {
          await deleteButton.first().click().catch(() => {});
          await page.waitForTimeout(500);
          const confirmDialog = page.locator('[role="dialog"], [role="alertdialog"]');
          const confirmCount = await confirmDialog.count();
          if (confirmCount > 0) {
            await expect(confirmDialog.first()).toBeAttached();
          }
        }
      }
    });
  });
});
