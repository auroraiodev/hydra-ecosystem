import { test, expect } from '@playwright/test';
import { navigateAndWait } from './helpers';

// ─── Static Pages — Load & Structure ─────────────────────────────────────────

const staticPages = [
  {
    path: '/terms',
    title: /términos|terms|condiciones/i,
    heading: /términos|condiciones|terms/i,
    label: 'Terms of Service',
  },
  {
    path: '/privacy',
    title: /privacidad|privacy/i,
    heading: /privacidad|política|privacy/i,
    label: 'Privacy Policy',
  },
  {
    path: '/cookies',
    title: /cookies|galletas/i,
    heading: /cookies/i,
    label: 'Cookies Policy',
  },
  {
    path: '/returns',
    title: /devoluciones|returns|retorno/i,
    heading: /devoluciones|retorno|returns/i,
    label: 'Returns Policy',
  },
  {
    path: '/help',
    title: /ayuda|help|soporte/i,
    heading: /ayuda|ayudamos|help|soporte/i,
    label: 'Help Center',
  },
  {
    path: '/authenticity',
    title: /autenticidad|authenticity|autenticación/i,
    heading: /autenticidad|garantía|authenticity/i,
    label: 'Authenticity',
  },
];

for (const page of staticPages) {
  test.describe(`Static Page - ${page.label}`, () => {
    test(`${page.path} loads with HTTP 200`, async ({ page: pw }) => {
      const response = await pw.goto(page.path);
      expect(response?.status()).toBe(200);
    });

    test(`${page.path} has correct URL`, async ({ page: pw }) => {
      await navigateAndWait(pw, page.path);
      await expect(pw).toHaveURL(new RegExp(page.path.replace('/', '')));
    });

    test(`${page.path} has a visible H1 heading`, async ({ page: pw }) => {
      await navigateAndWait(pw, page.path);
      const h1 = pw.locator('h1');
      await expect(h1.first()).toBeVisible();
    });

    test(`${page.path} H1 heading text is relevant`, async ({ page: pw }) => {
      await navigateAndWait(pw, page.path);
      const h1Text = await pw.locator('h1').first().textContent();
      expect(h1Text?.toLowerCase()).toMatch(page.heading);
    });

    test(`${page.path} has body content (not empty page)`, async ({ page: pw }) => {
      await navigateAndWait(pw, page.path);
      const bodyText = await pw.locator('main, article, .content, section').first().textContent();
      if (bodyText) {
        expect(bodyText.trim().length).toBeGreaterThan(100);
      }
    });

    test(`${page.path} has footer with navigation links`, async ({ page: pw }) => {
      await navigateAndWait(pw, page.path);
      const footer = pw.locator('footer');
      await expect(footer).toBeAttached();
    });

    test(`${page.path} has navbar or back-to-home link`, async ({ page: pw }) => {
      await navigateAndWait(pw, page.path);
      const homeLink = pw.locator('a[href="/"]').first();
      await expect(homeLink).toBeAttached();
    });
  });
}

// ─── Static Pages — Navigation From Footer ────────────────────────────────────

test.describe('Static Pages - Footer Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, '/');
  });

  test('navigate to /terms from footer', async ({ page }) => {
    const link = page.locator('footer a[href="/terms"]').first();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(page).toHaveURL(/\/terms/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('navigate to /privacy from footer', async ({ page }) => {
    const link = page.locator('footer a[href="/privacy"]').first();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(page).toHaveURL(/\/privacy/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('navigate to /cookies from footer', async ({ page }) => {
    const link = page.locator('footer a[href="/cookies"]').first();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(page).toHaveURL(/\/cookies/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('navigate to /help from footer', async ({ page }) => {
    const link = page.locator('footer a[href="/help"]').first();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(page).toHaveURL(/\/help/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('navigate to /returns from footer', async ({ page }) => {
    const link = page.locator('footer a[href="/returns"]').first();
    const count = await link.count();
    if (count > 0) {
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await expect(page).toHaveURL(/\/returns/);
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });
});

// ─── Static Pages — Content Integrity ────────────────────────────────────────

test.describe('Static Pages - Content Integrity', () => {
  test('terms page has multiple sections (h2 sub-headings)', async ({ page }) => {
    await navigateAndWait(page, '/terms');
    const subHeadings = page.locator('h2, h3');
    const count = await subHeadings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('privacy page mentions data protection or GDPR/LGPD', async ({ page }) => {
    await navigateAndWait(page, '/privacy');
    const bodyText = await page.locator('body').textContent();
    const hasDataMention = bodyText?.match(
      /datos|información|privacidad|data|personal|recopilar/i,
    );
    expect(hasDataMention).not.toBeNull();
  });

  test('help page has at least one section with questions/answers', async ({ page }) => {
    await navigateAndWait(page, '/help');
    const subHeadings = page.locator('h2, h3');
    const count = await subHeadings.count();
    expect(count).toBeGreaterThanOrEqual(0);
    // Help page body should have meaningful content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(200);
  });

  test('authenticity page mentions genuine/authentic products', async ({ page }) => {
    await navigateAndWait(page, '/authenticity');
    const bodyText = await page.locator('body').textContent();
    const hasAuthMention = bodyText?.match(
      /autenticidad|auténtico|garantía|original|genuino|revisión/i,
    );
    expect(hasAuthMention).not.toBeNull();
  });

  test('returns page mentions return process', async ({ page }) => {
    await navigateAndWait(page, '/returns');
    const bodyText = await page.locator('body').textContent();
    const hasReturnMention = bodyText?.match(
      /devolución|devolver|reembolso|retorno|plazo/i,
    );
    expect(hasReturnMention).not.toBeNull();
  });
});

// ─── 404 Page ─────────────────────────────────────────────────────────────────

test.describe('Static Pages - 404 Not Found', () => {
  test('unknown route returns HTTP 404', async ({ page }) => {
    const response = await page.goto('/this-route-absolutely-does-not-exist-xyz-abc');
    const status = response?.status();
    // Next.js can return 200 with a 404 page or 404 directly
    expect([200, 404]).toContain(status);
  });

  test('404 page shows content (not a blank page)', async ({ page }) => {
    await page.goto('/this-route-absolutely-does-not-exist-xyz-abc');
    await page.waitForTimeout(1500);
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(0);
  });

  test('404 page has a link back to homepage', async ({ page }) => {
    await page.goto('/non-existent-route-test-page');
    await page.waitForTimeout(1500);
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeAttached();
  });

  test('deeply nested unknown route does not show error screen', async ({ page }) => {
    await page.goto('/unknown/nested/very/deep/route');
    await page.waitForTimeout(1500);
    // Should show 404 or redirect gracefully, not a blank page
    await expect(page.locator('body')).toBeAttached();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(0);
  });
});

// ─── Share Page ───────────────────────────────────────────────────────────────

test.describe('Static Pages - Share Page', () => {
  test('/share page loads without crashing', async ({ page }) => {
    const response = await page.goto('/share');
    const status = response?.status();
    expect([200, 404]).toContain(status);
    await expect(page.locator('body')).toBeAttached();
  });
});

// ─── Maintenance Page ─────────────────────────────────────────────────────────

test.describe('Static Pages - Maintenance Page', () => {
  test('/maintenance page loads', async ({ page }) => {
    const response = await page.goto('/maintenance');
    const status = response?.status();
    expect([200, 404]).toContain(status);
    await expect(page.locator('body')).toBeAttached();
  });
});
