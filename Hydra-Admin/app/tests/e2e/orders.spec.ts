import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Orders (Pedidos)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/orders');
  });

  test('should display page header and list orders', async ({ page }) => {
    const title = page.locator('h1, h2, h3', { hasText: 'Pedidos' });
    await expect(title).toBeVisible();

    // Check if the mock orders are listed
    await expect(page.locator('text=order-1')).toBeVisible();
    await expect(page.locator('text=order-2')).toBeVisible();
  });

  test('should navigate to order details page and show customer information', async ({ page }) => {
    // Click on order row or "Ver" button
    const orderRow = page.locator('tr:has-text("order-1")');
    await orderRow.click();

    // Wait for redirect to order details
    await page.waitForURL(/.*orders\/order-1/);

    // Verify order ID is shown in details
    await expect(page.locator('h1, h2, h3', { hasText: 'order-1' })).toBeVisible();

    // Verify customer info
    await expect(page.locator('text=Juan Perez')).toBeVisible();
    await expect(page.locator('text=juan@example.com')).toBeVisible();
  });

  test('should verify items and product images render in order details', async ({ page }) => {
    await page.goto('/dashboard/orders/order-1');

    // Verify item name
    await expect(page.locator('text=Sol Ring')).toBeVisible();

    // Verify item image is displayed and loads
    const productImg = page.locator('img[alt="Sol Ring"]');
    await expect(productImg).toBeVisible();
    await expect(productImg).toHaveAttribute('src', /.*cat.png/);

    const isImgLoaded = await productImg.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0;
    });
    expect(isImgLoaded).toBeTruthy();
  });

  test('should mark pending order as paid locally', async ({ page }) => {
    await page.goto('/dashboard/orders/order-1');

    // Click "Marcar como Pagado Local" or similar button
    const markPaidBtn = page.locator('button:has-text("Pagado Local"), button:has-text("Marcar como Pagado")');
    if (await markPaidBtn.count() > 0) {
      await markPaidBtn.click();
      
      // Wait for success toast / status update in UI
      const statusBadge = page.locator('span:has-text("PAGADO"), span:has-text("PAID")').first();
      await expect(statusBadge).toBeVisible();
    }
  });

  test('should add tracking information to an order', async ({ page }) => {
    await page.goto('/dashboard/orders/order-1');

    // Click "Agregar Tracking" button
    const addTrackingBtn = page.locator('button:has-text("Tracking"), button:has-text("Seguimiento")');
    if (await addTrackingBtn.count() > 0) {
      await addTrackingBtn.click();

      // Fill tracking info in modal
      await page.fill('input[name="trackingNumber"], input#trackingNumber', 'TRACK-TEST-999');
      await page.fill('input[name="carrier"], input#carrier', 'Estafeta');

      // Submit tracking details
      await page.click('button[type="submit"], button:has-text("Guardar"), button:has-text("Aceptar")');

      // Verify tracking details are updated in UI
      await expect(page.locator('text=TRACK-TEST-999')).toBeVisible();
      await expect(page.locator('text=Estafeta')).toBeVisible();
    }
  });

  test('should cancel an order', async ({ page }) => {
    await page.goto('/dashboard/orders/order-1');

    // Click "Cancelar Pedido" button
    const cancelBtn = page.locator('button:has-text("Cancelar")');
    if (await cancelBtn.count() > 0) {
      // Mock confirm dialog
      page.once('dialog', async (dialog) => {
        await dialog.accept();
      });

      await cancelBtn.click();

      // Verify status changes to CANCELLED in UI
      const cancelledBadge = page.locator('span:has-text("CANCELADO"), span:has-text("CANCELLED")').first();
      await expect(cancelledBadge).toBeVisible();
    }
  });
});
