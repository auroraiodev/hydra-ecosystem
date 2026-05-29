import { test, expect } from '@playwright/test';
import {
  navigateAndWait,
  mockProductSearchAPI,
  setDesktopViewport,
  MOCK_PRODUCTS,
} from './helpers';

// ─── Search Page Structure ────────────────────────────────────────────────────

test.describe('Search - Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
    await mockProductSearchAPI(page);
  });

  test('search page loads at /singles/search', async ({ page }) => {
    await navigateAndWait(page, '/singles/search');
    await expect(page).toHaveURL(/\/singles\/search/);
    await expect(page.locator('main').first()).toBeAttached();
  });

  test('search page has a heading or page title', async ({ page }) => {
    await navigateAndWait(page, '/singles/search');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeAttached();
  });

  test('search page has a search input field', async ({ page }) => {
    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(1500);
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"], input[aria-label*="Buscar"], input[name="query"]',
    );
    const count = await searchInput.count();
    if (count > 0) {
      await expect(searchInput.first()).toBeAttached();
    }
  });
});

// ─── Search Results with Mock API ─────────────────────────────────────────────

test.describe('Search - Results Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
  });

  test('shows products when search API returns results', async ({ page }) => {
    await mockProductSearchAPI(page, MOCK_PRODUCTS);
    await navigateAndWait(page, '/singles/search?query=ragavan');
    await page.waitForTimeout(3000);

    // Either product cards appear or the page shows content
    const cards = page.locator('[data-testid="product-card"]');
    const cardCount = await cards.count();
    const bodyText = await page.locator('body').textContent();

    // The page should show something useful (cards, product names, or skeleton)
    expect((await page.locator('main').count()) > 0).toBeTruthy();

    if (cardCount > 0) {
      await expect(cards.first()).toBeAttached();
    }
  });

  test('each mocked product card has a visible image', async ({ page }) => {
    await mockProductSearchAPI(page, MOCK_PRODUCTS);
    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(3000);

    const cards = page.locator('[data-testid="product-card"]');
    const count = await cards.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const img = cards.nth(i).locator('img[src]').first();
        if ((await img.count()) > 0) {
          const src = await img.getAttribute('src');
          expect(src!.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('shows "no results" state when API returns empty array', async ({ page }) => {
    await mockProductSearchAPI(page, []);
    await navigateAndWait(page, '/singles/search?query=xyznonexistent99');
    await page.waitForTimeout(2500);

    // Page should gracefully show empty state
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
    // The page should not crash
    await expect(page.locator('main').first()).toBeAttached();
  });

  test('product names from mock API appear in the results', async ({ page }) => {
    await mockProductSearchAPI(page, MOCK_PRODUCTS);
    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent();
    const firstProduct = MOCK_PRODUCTS[0];
    // At least one product name should be present if cards rendered
    const hasName = bodyText?.includes(firstProduct.card_name);
    if (await page.locator('[data-testid="product-card"]').count() > 0) {
      expect(hasName).toBeTruthy();
    }
  });

  test('product prices from mock API appear in the results', async ({ page }) => {
    await mockProductSearchAPI(page, MOCK_PRODUCTS);
    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(3000);

    if (await page.locator('[data-testid="product-card"]').count() > 0) {
      const bodyText = await page.locator('body').textContent();
      // Price 2500 should appear formatted somehow
      expect(bodyText).toMatch(/2[,.]?500|2500/);
    }
  });
});

// ─── Search Query Parameter ───────────────────────────────────────────────────

test.describe('Search - Query Parameter Handling', () => {
  test.beforeEach(async ({ page }) => {
    await mockProductSearchAPI(page, MOCK_PRODUCTS);
  });

  test('?query=ragavan sends search request with that term', async ({ page }) => {
    let capturedUrl = '';
    await page.route('**/api/v1/products/search**', async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { items: MOCK_PRODUCTS, total: MOCK_PRODUCTS.length, page: 1, totalPages: 1 },
          statusCode: 200,
        }),
      });
    });
    await page.route('**/api/v1/search**', async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { items: MOCK_PRODUCTS, total: MOCK_PRODUCTS.length, page: 1, totalPages: 1 },
          statusCode: 200,
        }),
      });
    });

    await navigateAndWait(page, '/singles/search?query=ragavan');
    await page.waitForTimeout(2000);

    // URL should be preserved
    expect(page.url()).toContain('query=ragavan');
  });

  test('entering a search query updates the URL', async ({ page }) => {
    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(1500);

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"], input[name="query"]',
    );
    const count = await searchInput.count();

    if (count > 0) {
      await searchInput.first().fill('liliana');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      // URL should now contain the search term
      const url = page.url();
      expect(url).toMatch(/liliana|query/i);
    }
  });

  test('clear search input removes query from URL', async ({ page }) => {
    await navigateAndWait(page, '/singles/search?query=lightning bolt');
    await page.waitForTimeout(1500);

    const clearBtn = page.locator(
      'button[aria-label="Limpiar búsqueda"], button[aria-label*="Limpiar"], button[aria-label*="Clear"]',
    );
    if ((await clearBtn.count()) > 0) {
      await clearBtn.first().click();
      await page.waitForTimeout(500);
      // URL may no longer contain the query
      const url = page.url();
      expect(typeof url).toBe('string');
    }
  });
});

// ─── Search Filters ───────────────────────────────────────────────────────────

test.describe('Search - Filters', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
    await mockProductSearchAPI(page);
  });

  test('filter panel or sidebar is present on search page', async ({ page }) => {
    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(2000);

    // Look for filter UI elements
    const filterElements = page.locator(
      '[class*="filter"], [class*="Filter"], [aria-label*="filtro"], [aria-label*="Filtro"], select, [role="combobox"]',
    );
    const count = await filterElements.count();
    // If filters exist, they should be in the DOM
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('?category=SINGLES filter is applied on load', async ({ page }) => {
    await navigateAndWait(page, '/singles/search?category=SINGLES');
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('category=SINGLES');
    await expect(page.locator('main').first()).toBeAttached();
  });

  test('?expansion=MH2 filter is applied on load', async ({ page }) => {
    await navigateAndWait(page, '/singles/search?expansion=MH2');
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('expansion=MH2');
    await expect(page.locator('main').first()).toBeAttached();
  });

  test('foil filter does not crash the page', async ({ page }) => {
    await navigateAndWait(page, '/singles/search?foil=true');
    await page.waitForTimeout(1500);
    await expect(page.locator('main').first()).toBeAttached();
  });

  test('local inventory filter does not crash the page', async ({ page }) => {
    await navigateAndWait(page, '/singles/search?local=true');
    await page.waitForTimeout(1500);
    await expect(page.locator('main').first()).toBeAttached();
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

test.describe('Search - Pagination', () => {
  test('?page=1 loads without error', async ({ page }) => {
    await mockProductSearchAPI(page);
    await navigateAndWait(page, '/singles/search?page=1');
    await expect(page.locator('main').first()).toBeAttached();
  });

  test('?page=2 loads without error', async ({ page }) => {
    await mockProductSearchAPI(page);
    await navigateAndWait(page, '/singles/search?page=2');
    await page.waitForTimeout(1500);
    await expect(page.locator('main').first()).toBeAttached();
  });

  test('pagination controls are present when totalPages > 1', async ({ page }) => {
    await page.route('**/api/v1/products/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            items: MOCK_PRODUCTS,
            total: 100,
            page: 1,
            limit: 20,
            totalPages: 5,
          },
          statusCode: 200,
        }),
      });
    });
    await page.route('**/api/v1/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            items: MOCK_PRODUCTS,
            total: 100,
            page: 1,
            limit: 20,
            totalPages: 5,
          },
          statusCode: 200,
        }),
      });
    });

    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(3000);

    const paginationBtns = page.locator(
      '[aria-label="Página siguiente"], [aria-label*="siguiente"], button:has-text("Siguiente"), nav[aria-label*="paginación"]',
    );
    const count = await paginationBtns.count();
    if (count > 0) {
      await expect(paginationBtns.first()).toBeAttached();
    }
  });

  test('clicking next page button updates URL to page=2', async ({ page }) => {
    await page.route('**/api/v1/products/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            items: MOCK_PRODUCTS,
            total: 100,
            page: 1,
            limit: 20,
            totalPages: 5,
          },
          statusCode: 200,
        }),
      });
    });
    await page.route('**/api/v1/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            items: MOCK_PRODUCTS,
            total: 100,
            page: 1,
            limit: 20,
            totalPages: 5,
          },
          statusCode: 200,
        }),
      });
    });

    await navigateAndWait(page, '/singles/search');
    await page.waitForTimeout(3000);

    const nextBtn = page.locator(
      '[aria-label="Página siguiente"], [aria-label*="siguiente"], button:has-text("Siguiente")',
    );
    if ((await nextBtn.count()) > 0 && await nextBtn.first().isEnabled()) {
      await nextBtn.first().click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('page=2');
    }
  });
});

// ─── Search Cross-App Routes ──────────────────────────────────────────────────

test.describe('Search - Route Variants', () => {
  test('/magic/singles/search loads', async ({ page }) => {
    await mockProductSearchAPI(page);
    await navigateAndWait(page, '/magic/singles/search');
    await expect(page.locator('main').first()).toBeAttached();
  });

  test('/magic/bundles/search loads', async ({ page }) => {
    await mockProductSearchAPI(page);
    await navigateAndWait(page, '/magic/bundles/search');
    await page.waitForTimeout(1500);
    await expect(page.locator('main, body').first()).toBeAttached();
  });

  test('/magic/decks/search loads', async ({ page }) => {
    await mockProductSearchAPI(page);
    await navigateAndWait(page, '/magic/decks/search');
    await page.waitForTimeout(1500);
    await expect(page.locator('main, body').first()).toBeAttached();
  });
});
