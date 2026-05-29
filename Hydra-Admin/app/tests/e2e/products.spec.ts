import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Products (Inventario)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/products');
  });

  test('should display page header and list products', async ({ page }) => {
    const title = page.locator('h1, h2, h3', { hasText: 'Inventario' });
    await expect(title).toBeVisible();

    // Check if both products from our mock backend are listed
    await expect(page.locator('text=Black Lotus')).toBeVisible();
    await expect(page.locator('text=Mox Diamond')).toBeVisible();
  });

  test('should verify product images load correctly in the table', async ({ page }) => {
    // Locate product row images
    const lotusImage = page.locator('img[alt="Black Lotus"]');
    await expect(lotusImage).toBeAttached();
    await expect(lotusImage).toHaveAttribute('src', /.*cat.png/);

    const moxImage = page.locator('img[alt="Mox Diamond"]');
    await expect(moxImage).toBeAttached();
    await expect(moxImage).toHaveAttribute('src', /.*cat.png/);

    // Verify they have correct size/rendering dimensions
    const isLotusImageLoaded = await lotusImage.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0;
    });
    expect(isLotusImageLoaded).toBeTruthy();
  });

  test('should increment and decrement product stock inline', async ({ page }) => {
    const blackLotusRow = page.locator('tr:has-text("Black Lotus")');
    const stockDisplay = blackLotusRow.locator('span.tabular-nums');
    await expect(stockDisplay).toHaveText('1');

    // Click increment button (+)
    const incrementBtn = blackLotusRow.locator('button[aria-label*="Aumentar stock"]');
    await incrementBtn.click();

    // Verify stock changes to 2 in UI
    await expect(stockDisplay).toHaveText('2');

    // Click decrement button (-)
    const decrementBtn = blackLotusRow.locator('button[aria-label*="Reducir stock"]');
    await decrementBtn.click();

    // Verify stock returns to 1 in UI
    await expect(stockDisplay).toHaveText('1');
  });

  test('should update product foil status inline', async ({ page }) => {
    const blackLotusRow = page.locator('tr:has-text("Black Lotus")');
    const foilSwitch = blackLotusRow.locator('div[role="switch"]');

    // Currently foil is false for Black Lotus
    await expect(foilSwitch).toHaveAttribute('aria-checked', 'false');

    // Toggle the switch
    await foilSwitch.click();

    // Verify it changes to true in UI
    await expect(foilSwitch).toHaveAttribute('aria-checked', 'true');
  });

  test('should update product condition dropdown inline', async ({ page }) => {
    const blackLotusRow = page.locator('tr:has-text("Black Lotus")');
    const conditionSelect = blackLotusRow.locator('select[aria-label*="Estado"]');

    await expect(conditionSelect).toHaveValue('cond-nm');

    // Change to LP
    await conditionSelect.selectOption('cond-lp');

    // Verify it changes
    await expect(conditionSelect).toHaveValue('cond-lp');
  });

  test('should update product language dropdown inline', async ({ page }) => {
    const blackLotusRow = page.locator('tr:has-text("Black Lotus")');
    const languageSelect = blackLotusRow.locator('select[aria-label*="Idioma"]');

    await expect(languageSelect).toHaveValue('lang-en');

    // Change to ES
    await languageSelect.selectOption('lang-es');

    // Verify it changes
    await expect(languageSelect).toHaveValue('lang-es');
  });

  test('should toggle tags inline', async ({ page }) => {
    const blackLotusRow = page.locator('tr:has-text("Black Lotus")');
    const tagButton = blackLotusRow.locator('button:has-text("Commander")');

    // Tag should initially be active (bg-primary class or check styles)
    await expect(tagButton).toHaveClass(/bg-primary/);

    // Toggle off
    await tagButton.click();

    // Should lose bg-primary
    await expect(tagButton).not.toHaveClass(/bg-primary/);

    // Toggle back on
    await tagButton.click();
    await expect(tagButton).toHaveClass(/bg-primary/);
  });

  test('should navigate to add product page and successfully create a new product', async ({ page }) => {
    // Click "Nuevo Producto"
    await page.click('button:has-text("Nuevo Producto")');
    await page.waitForURL(/.*products\/add/, { waitUntil: 'domcontentloaded' });

    // Verify we are on product form page
    await expect(page.locator('h1, h2, h3', { hasText: 'Nuevo Producto' })).toBeVisible();

    // Fill form
    await page.fill('input[name="name"], input#name', 'Mox Emerald');
    await page.fill('input[name="cardSet"]', 'Beta');
    await page.fill('input[name="cardNumber"]', '12');
    await page.fill('input[name="price"]', '15000');
    await page.fill('input[name="stock"]', '2');
    
    // Select TCG, Category, Condition, Language
    await page.selectOption('select[name="tcg"]', 'mtg');
    await page.selectOption('select[name="category"]', 'Singles');
    await page.selectOption('select[name="condition_id"]', 'cond-nm');
    await page.selectOption('select[name="language_id"]', 'lang-en');
    await page.selectOption('select[name="owner_id"]', 'admin-id-123');

    // Fill image URL using local /cat.png
    const imgInput = page.locator('input[name="img"], input#img, input[placeholder*="imagen"]');
    if (await imgInput.count() > 0) {
      await imgInput.fill('/cat.png');
    }

    // Submit form
    await page.click('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")');

    // Verify toast or redirect back to inventory list
    await page.waitForURL(/.*products/, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Mox Emerald')).toBeVisible();

    // Confirm that the image loads for the new product
    const emeraldImage = page.locator('img[alt="Mox Emerald"]');
    await expect(emeraldImage).toBeAttached();
    await expect(emeraldImage).toHaveAttribute('src', /.*cat.png/);
  });

  test('should delete product through row action', async ({ page }) => {
    // We want to delete "Mox Diamond"
    const moxRow = page.locator('tr:has-text("Mox Diamond")');
    const deleteBtn = moxRow.locator('button[aria-label*="Eliminar"], button:has(.size-3\\.5)');

    // Mock confirm dialog
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('delete');
      await dialog.accept();
    });

    await deleteBtn.click();

    // Should no longer be visible in table
    await expect(page.locator('text=Mox Diamond')).not.toBeVisible();
  });
});
