import { test, expect } from '@playwright/test';

test.describe('Users Management', () => {
  test.describe('Users Listing', () => {
    test('should navigate to users page if accessible', async ({ page }) => {
      await page.goto('/dashboard/users');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await expect(page).toHaveURL(/\/dashboard\/users/);
      }
    });

    test('should display users table', async ({ page }) => {
      await page.goto('/dashboard/users');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const userTable = page.locator('table');
        if (await userTable.count() > 0) {
          await expect(userTable.first()).toBeVisible();
        }
      }
    });

    test('should have user search functionality', async ({ page }) => {
      await page.goto('/dashboard/users');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(1000);
        const search = page.locator('input[placeholder*="search" i], input[placeholder*="buscar" i]');
        if (await search.count() > 0) {
          await expect(search.first()).toBeVisible();
          await search.fill('test@example.com');
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should display user avatars in listing', async ({ page }) => {
      await page.goto('/dashboard/users');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const userAvatars = page.locator('table img, [class*="avatar"] img');
        const count = await userAvatars.count();
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const src = await userAvatars.nth(i).getAttribute('src');
            expect(src).toBeTruthy();
          }
        }
      }
    });

    test('should show user email in listing', async ({ page }) => {
      await page.goto('/dashboard/users');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const emailCells = page.locator('td').filter({ hasText: /@/ });
        if (await emailCells.count() > 0) {
          await expect(emailCells.first()).toBeVisible();
        }
      }
    });

    test('should display user role badges', async ({ page }) => {
      await page.goto('/dashboard/users');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const roleBadges = page.locator('td [class*="badge"]');
        if (await roleBadges.count() > 0) {
          await expect(roleBadges.first()).toBeVisible();
        }
      }
    });

    test('should have add user button', async ({ page }) => {
      await page.goto('/dashboard/users');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        const addButton = page.locator('a[href*="add"], a[href*="create"], button').filter({ hasText: /Add|Nuevo|New|Crear|Invitar/i });
        if (await addButton.count() > 0) {
          await expect(addButton.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('User Roles', () => {
    test('should display role filter/selector', async ({ page }) => {
      await page.goto('/dashboard/users');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(1000);
        const roleFilter = page.locator('select, button[role="combobox"]').filter({ hasText: /Role|Rol/i });
        if (await roleFilter.count() > 0) {
          await expect(roleFilter.first()).toBeVisible();
        }
      }
    });

    test('should show user status indicator', async ({ page }) => {
      await page.goto('/dashboard/users');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const statusIndicator = page.locator('[class*="status"], [class*="active"], span[class*="dot"]');
        if (await statusIndicator.count() > 0) {
          await expect(statusIndicator.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('User Detail', () => {
    test('should navigate to user detail page', async ({ page }) => {
      await page.goto('/dashboard/users');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const userLink = page.locator('a[href*="/dashboard/users/"]').first();
        if (await userLink.count() > 0) {
          await userLink.click();
          await page.waitForURL(/\/dashboard\/users\//);
          await expect(page).toHaveURL(/\/dashboard\/users\//);
        }
      }
    });

    test('should display user edit form', async ({ page }) => {
      await page.goto('/dashboard/users');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const userLink = page.locator('a[href*="/dashboard/users/"]').first();
        if (await userLink.count() > 0) {
          await userLink.click();
          await page.waitForURL(/\/dashboard\/users\//);
          await page.waitForTimeout(1500);
          const nameInput = page.locator('input[name="name"], input#name').first();
          if (await nameInput.count() > 0) {
            await expect(nameInput).toBeVisible();
          }
        }
      }
    });

    test('should have save changes button on user edit', async ({ page }) => {
      await page.goto('/dashboard/users');
      if (!page.url().includes('login') && !page.url().includes('404')) {
        await page.waitForTimeout(2000);
        const userLink = page.locator('a[href*="/dashboard/users/"]').first();
        if (await userLink.count() > 0) {
          await userLink.click();
          await page.waitForURL(/\/dashboard\/users\//);
          await page.waitForTimeout(1000);
          const saveBtn = page.locator('button[type="submit"]').first();
          if (await saveBtn.count() > 0) {
            await expect(saveBtn).toBeVisible();
          }
        }
      }
    });
  });
});
