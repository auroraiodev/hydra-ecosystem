import { expect, type Page } from '@playwright/test';

export async function loginAsUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const response = await page.request.post('/api/auth/login', {
    data: { email, password },
  });
  const body = await response.json();
  return body;
}

export async function navigateAndWait(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

export async function expectPageTitle(page: Page, partial: string | RegExp): Promise<void> {
  const title = await page.title();
  if (partial instanceof RegExp) {
    expect(title).toMatch(partial);
  } else {
    expect(title).toContain(partial);
  }
}

export async function expectHeading(page: Page, text: string): Promise<void> {
  await expect(page.locator('h1, h2, h3', { hasText: text }).first()).toBeVisible();
}

export async function expectLink(page: Page, href: string, name?: string): Promise<void> {
  const link = name
    ? page.locator(`a[href="${href}"]`, { hasText: name })
    : page.locator(`a[href="${href}"]`);
  await expect(link.first()).toBeVisible();
}

export async function fillInput(page: Page, id: string, value: string): Promise<void> {
  await page.locator(`#${id}`).fill(value);
}

export async function clickButton(page: Page, text: string): Promise<void> {
  await page.locator('button', { hasText: text }).click();
}

export async function isMobile(page: Page): Promise<boolean> {
  const width = page.viewportSize()?.width ?? 1280;
  return width < 1024;
}
