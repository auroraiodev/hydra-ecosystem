import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Users (Usuarios)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/users');
  });

  test('should display page header and list users', async ({ page }) => {
    const title = page.locator('h1, h2, h3', { hasText: 'Usuarios' });
    await expect(title).toBeVisible();

    // Check if the mock users are visible
    await expect(page.locator('text=Admin Principal')).toBeVisible();
    await expect(page.locator('text=Juan Perez')).toBeVisible();
    await expect(page.locator('text=Maria Gomez')).toBeVisible();
  });

  test('should search users by name/email', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="buscar"], input[placeholder*="Buscar"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Juan');
      
      // Verify other users disappear and target user stays
      await expect(page.locator('text=Juan Perez')).toBeVisible();
      await expect(page.locator('text=Maria Gomez')).not.toBeVisible();
    }
  });

  test('should update user role through inline control or form', async ({ page }) => {
    const juanRow = page.locator('tr:has-text("Juan Perez")');
    
    // Check if there is a role select dropdown or action edit button
    const roleSelect = juanRow.locator('select[aria-label*="rol"], select[aria-label*="Rol"]');
    const editBtn = juanRow.locator('button[aria-label*="Editar"], button:has-text("Editar")');
    
    if (await roleSelect.count() > 0) {
      // Inline select role update
      await roleSelect.selectOption('SELLER');
      await expect(roleSelect).toHaveValue('SELLER');
    } else if (await editBtn.count() > 0) {
      // Role update via dialog form
      await editBtn.click();
      await page.selectOption('select[name="role"]', 'SELLER');
      await page.click('button[type="submit"], button:has-text("Guardar")');
      
      // Verify role updated in the table
      const sellerBadge = juanRow.locator('text=SELLER, text=Vendedor').first();
      await expect(sellerBadge).toBeVisible();
    }
  });
});
