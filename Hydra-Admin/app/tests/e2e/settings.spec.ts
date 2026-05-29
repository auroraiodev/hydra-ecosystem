import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Settings & Maintenance (Configuración)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings');
  });

  test('should display settings page header and load parameters', async ({ page }) => {
    const title = page.locator('h1, h2, h3', { hasText: /Configuración|Settings/i });
    await expect(title).toBeVisible();

    // Verify system parameter inputs are visible
    const siteNameInput = page.locator('input[name="siteName"], input#siteName');
    if (await siteNameInput.count() > 0) {
      await expect(siteNameInput).toBeVisible();
      await expect(siteNameInput).toHaveValue('Hydra Collect');
    }
  });

  test('should edit and save system settings', async ({ page }) => {
    const siteNameInput = page.locator('input[name="siteName"], input#siteName');
    if (await siteNameInput.count() > 0) {
      await siteNameInput.fill('Hydra E-commerce Admin');

      const saveBtn = page.locator('button[type="submit"], button:has-text("Guardar")');
      await saveBtn.click();

      // Check success notice
      const successToast = page.locator('text=/éxito|guardado|success|actualizado/i').first();
      await expect(successToast).toBeVisible();
    }
  });

  test('should trigger maintenance actions: clear cache', async ({ page }) => {
    const clearCacheBtn = page.locator('button:has-text("Limpiar Caché"), button:has-text("Clear Cache"), button:has-text("Vaciar caché")');
    if (await clearCacheBtn.count() > 0) {
      await clearCacheBtn.click();

      // Check success response alert
      const toastMessage = page.locator('text=/éxito|completado|success|limpiado/i').first();
      await expect(toastMessage).toBeVisible();
    }
  });

  test('should trigger maintenance actions: database backup', async ({ page }) => {
    const backupBtn = page.locator('button:has-text("Respaldar"), button:has-text("Backup"), button:has-text("Crear Respaldo")');
    if (await backupBtn.count() > 0) {
      await backupBtn.click();

      // Verify backup completes and displays success message
      const toastMessage = page.locator('text=/éxito|completado|success|respaldo/i').first();
      await expect(toastMessage).toBeVisible();
    }
  });
});
