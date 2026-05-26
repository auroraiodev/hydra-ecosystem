import { test, expect } from '@playwright/test';
import { navigateAndWait, fillInput } from './helpers';

test.describe('Form Validation - Login', () => {
  test('login requires email input', async ({ page }) => {
    await navigateAndWait(page, '/login');
    const emailInput = page.locator('#email');
    await emailInput.focus();
    await emailInput.blur();
    await page.waitForTimeout(200);
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBeFalsy();
  });

  test('login requires password input', async ({ page }) => {
    await navigateAndWait(page, '/login');
    const passwordInput = page.locator('#password');
    await passwordInput.focus();
    await passwordInput.blur();
    await page.waitForTimeout(200);
    const validity = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBeFalsy();
  });

  test('login rejects invalid email format', async ({ page }) => {
    await navigateAndWait(page, '/login');
    const emailInput = page.locator('#email');
    await fillInput(page, 'email', 'not-an-email');
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBeFalsy();
  });

  test('login password field masks input by default', async ({ page }) => {
    await navigateAndWait(page, '/login');
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  });
});

test.describe('Form Validation - Signup', () => {
  test('signup validates required first name', async ({ page }) => {
    await navigateAndWait(page, '/signup');
    const firstNameInput = page.locator('#firstName');
    await firstNameInput.focus();
    await firstNameInput.blur();
    await page.waitForTimeout(200);
    const validity = await firstNameInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBeFalsy();
  });

  test('signup validates required last name', async ({ page }) => {
    await navigateAndWait(page, '/signup');
    const lastNameInput = page.locator('#lastName');
    await lastNameInput.focus();
    await lastNameInput.blur();
    await page.waitForTimeout(200);
    const validity = await lastNameInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBeFalsy();
  });

  test('signup requires terms acceptance', async ({ page }) => {
    await navigateAndWait(page, '/signup');
    const termsCheckbox = page.locator('#terms');
    await expect(termsCheckbox).toBeVisible();
    const isChecked = await termsCheckbox.isChecked();
    expect(isChecked).toBeFalsy();
  });

  test('signup password field enforces minlength', async ({ page }) => {
    await navigateAndWait(page, '/signup');
    const passwordInput = page.locator('#password');
    const minLength = await passwordInput.getAttribute('minLength');
    expect(minLength).toBe('8');
  });

  test('signup username field enforces minlength', async ({ page }) => {
    await navigateAndWait(page, '/signup');
    const usernameInput = page.locator('#username');
    const minLength = await usernameInput.getAttribute('minLength');
    expect(Number(minLength)).toBeGreaterThanOrEqual(3);
  });
});
