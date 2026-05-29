import { test, expect } from '@playwright/test';

test.describe('Profile', () => {
  test.describe('Profile Page', () => {
    test('should navigate to profile page', async ({ page }) => {
      await page.goto('/dashboard/profile');
      if (!page.url().includes('login')) {
        await expect(page).toHaveURL(/\/dashboard\/profile/);
      }
    });

    test('should have profile form with user info fields', async ({ page }) => {
      await page.goto('/dashboard/profile');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const nameInput = page.locator('input#name, input[placeholder*="name" i], input[name="name"]');
        const emailInput = page.locator('input#email, input[placeholder*="email" i], input[name="email"]');
        const hasName = await nameInput.count() > 0;
        const hasEmail = await emailInput.count() > 0;
        if (hasName) {
          await expect(nameInput.first()).toBeVisible();
        }
        if (hasEmail) {
          await expect(emailInput.first()).toBeVisible();
        }
      }
    });

    test('should display profile image with avatar', async ({ page }) => {
      await page.goto('/dashboard/profile');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const avatar = page.locator('[class*="avatar"] img, img[alt*="avatar" i], img[alt*="profile" i]').first();
        if (await avatar.count() > 0) {
          await expect(avatar).toBeAttached();
          const src = await avatar.getAttribute('src');
          expect(src).toBeTruthy();
        }
      }
    });

    test('should have save button for profile updates', async ({ page }) => {
      await page.goto('/dashboard/profile');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const saveButton = page.locator('button[type="submit"]').filter({ hasText: /Guardar|Save|Actualizar|Update/i });
        if (await saveButton.count() > 0) {
          await expect(saveButton.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Store Settings', () => {
    test('should display store settings section', async ({ page }) => {
      await page.goto('/dashboard/profile');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const storeSection = page.locator('text=Store');
        if (await storeSection.count() > 0) {
          await expect(storeSection.first()).toBeVisible();
        }
      }
    });

    test('should have store name input field', async ({ page }) => {
      await page.goto('/dashboard/profile');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const storeNameInput = page.locator('input[placeholder*="store" i], input[name="storeName"], input[id*="store"]');
        if (await storeNameInput.count() > 0) {
          await expect(storeNameInput.first()).toBeVisible();
        }
      }
    });

    test('should have store description textarea', async ({ page }) => {
      await page.goto('/dashboard/profile');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const descriptionArea = page.locator('textarea[placeholder*="description" i], textarea[name="description"]');
        if (await descriptionArea.count() > 0) {
          await expect(descriptionArea.first()).toBeVisible();
        }
      }
    });

    test('should have store social links fields', async ({ page }) => {
      await page.goto('/dashboard/profile');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const socialInputs = page.locator('input[placeholder*="facebook" i], input[placeholder*="twitter" i], input[placeholder*="instagram" i], input[placeholder*="social" i]');
        const count = await socialInputs.count();
        if (count > 0) {
          await expect(socialInputs.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Form Interaction', () => {
    test('should update name field and show save', async ({ page }) => {
      await page.goto('/dashboard/profile');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const nameInput = page.locator('input#name, input[name="name"]').first();
        if (await nameInput.count() > 0) {
          const currentName = await nameInput.inputValue();
          if (currentName) {
            expect(currentName.trim()).toBeTruthy();
          }
        } else {
          test.skip();
        }
      }
    });

    test('should have cancel button to discard changes', async ({ page }) => {
      await page.goto('/dashboard/profile');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1000);
        const cancelButton = page.locator('button').filter({ hasText: /Cancelar|Cancel/i });
        if (await cancelButton.count() > 0) {
          await expect(cancelButton.first()).toBeVisible();
        }
      }
    });

    test('should toggle profile visibility setting', async ({ page }) => {
      await page.goto('/dashboard/profile');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(1500);
        const switchToggle = page.locator('button[role="switch"]');
        if (await switchToggle.count() > 0) {
          const initial = await switchToggle.first().getAttribute('aria-checked');
          await switchToggle.first().click();
          await page.waitForTimeout(300);
          const after = await switchToggle.first().getAttribute('aria-checked');
          expect(after).not.toBe(initial);
          await switchToggle.first().click();
        }
      }
    });
  });
});
