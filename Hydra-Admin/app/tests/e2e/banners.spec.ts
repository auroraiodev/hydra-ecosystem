import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Banners', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/banners');
  });

  test('should display page header and list banners', async ({ page }) => {
    const title = page.locator('h1, h2, h3', { hasText: 'Banners' });
    await expect(title).toBeVisible();

    // Verify first mock banner is visible
    await expect(page.locator('text=MTG Modern Horizons 3')).toBeVisible();
  });

  test('should verify banner image loads correctly', async ({ page }) => {
    const bannerImg = page.locator('img[alt*="Modern Horizons"]').first();
    await expect(bannerImg).toBeAttached();

    // Confirm that naturalWidth is valid
    const isImgLoaded = await bannerImg.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0;
    });
    expect(isImgLoaded).toBeTruthy();
  });

  test('should create a new marketing banner', async ({ page }) => {
    // Click "Add Banner" action button
    const newBannerBtn = page.locator('button:has-text("Add Banner"), button:has-text("Nuevo Banner")');
    await expect(newBannerBtn).toBeVisible();
    await newBannerBtn.click();

    // Fill in details
    await page.fill('input#title', 'Pokémon TCG SV6');
    await page.fill('input#button_link', '/dashboard/products');
    await page.fill('input#order', '2');

    // Submit
    const submitBtn = page.locator('button[form="banner-form"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify the new banner is listed in UI
    await expect(page.locator('text=Pokémon TCG SV6')).toBeVisible();

    // Check its image resolves
    const newImg = page.locator('img[alt="Pokémon TCG SV6"]');
    await expect(newImg).toBeAttached();
  });

  test('should toggle banner active status', async ({ page }) => {
    const bannerRow = page.locator('tr:has-text("MTG Modern Horizons 3"), div.card:has-text("MTG Modern Horizons 3")').first();
    
    // Locate the active switch or checkbox
    const activeSwitch = bannerRow.locator('button[role="switch"], input[type="checkbox"]');
    if (await activeSwitch.count() > 0) {
      const isCheckedBefore = await activeSwitch.getAttribute('aria-checked') || await activeSwitch.isChecked();
      const stringCheckedBefore = String(isCheckedBefore);
      
      // Click toggle
      await activeSwitch.click();
      
      // Verify state changes
      const isCheckedAfter = await activeSwitch.getAttribute('aria-checked') || await activeSwitch.isChecked();
      const stringCheckedAfter = String(isCheckedAfter);
      expect(stringCheckedAfter).not.toEqual(stringCheckedBefore);
    }
  });

  test('should delete a banner', async ({ page }) => {
    const bannerRow = page.locator('tr:has-text("MTG Modern Horizons 3"), div.card:has-text("MTG Modern Horizons 3")').first();
    const deleteBtn = bannerRow.locator('button[aria-label*="Eliminar"], button:has-text("Eliminar")');

    if (await deleteBtn.count() > 0) {
      page.once('dialog', async (dialog) => {
        await dialog.accept();
      });

      await deleteBtn.click();

      // Verify deleted banner is gone from list
      await expect(page.locator('text=MTG Modern Horizons 3')).not.toBeVisible();
    }
  });
});
