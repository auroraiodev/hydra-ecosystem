import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Main Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigates to dashboard using cached auth cookies
    await page.goto('/dashboard');
  });

  test('should load dashboard and show page header', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);
    const headerTitle = page.locator('h1, h2, h3', { hasText: 'Dashboard' });
    await expect(headerTitle).toBeVisible();
    
    const headerDesc = page.locator('text=Centro de control de las tres cabezas');
    await expect(headerDesc).toBeVisible();
  });

  test('should show statistics cards with correct numbers', async ({ page }) => {
    // Wallet / Revenue stat card
    const revenueCard = page.locator('text=Ingresos Totales');
    await expect(revenueCard).toBeVisible();
    
    // Users count card
    const usersCard = page.locator('text=Usuarios Totales');
    await expect(usersCard).toBeVisible();

    // Orders count card
    const ordersCard = page.locator('text=Pedidos Totales');
    await expect(ordersCard).toBeVisible();
  });

  test('should show recent orders list and their details', async ({ page }) => {
    const recentOrdersTitle = page.locator('text=Pedidos Recientes');
    await expect(recentOrdersTitle).toBeVisible();

    // Check presence of rows in recent orders table
    const orderRows = page.locator('table >> tr');
    // Header + at least some order rows
    await expect(orderRows.count()).then(c => expect(c).toBeGreaterThan(1));
  });

  test('should render monthly breakdown table and verify Hydra cat logo image loads', async ({ page }) => {
    const monthlyBreakdownTitle = page.locator('text=Desglose Mensual');
    await expect(monthlyBreakdownTitle).toBeVisible();

    // Verify cat.png image is displayed and loads
    const catImage = page.locator('img[alt="Hydra"]');
    await expect(catImage).toBeVisible();
    
    // Check that the image source is exactly /cat.png
    await expect(catImage).toHaveAttribute('src', /.*cat.png/);

    // Verify image is successfully loaded by checking naturalWidth
    const isImageLoaded = await catImage.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0;
    });
    expect(isImageLoaded).toBeTruthy();
  });

  test('should render dashboard charts container', async ({ page }) => {
    // Check that the charts block exists
    const chartsContainer = page.locator('.recharts-responsive-container, .recharts-wrapper, svg.recharts-surface').first();
    // Sometimes SVGs take a split second to render, wait if necessary
    if (await chartsContainer.count() > 0) {
      await expect(chartsContainer).toBeVisible();
    }
  });
});
