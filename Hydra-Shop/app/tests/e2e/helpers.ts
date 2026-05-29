import { expect, type Page } from '@playwright/test';

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_USER = {
  id: 'user-test-uuid-1',
  email: 'test@hydracollect.com',
  username: 'testplayer',
  first_name: 'Test',
  last_name: 'Player',
  role: 'CLIENT',
  balance: '250.00',
  is_active: true,
  email_verified: true,
  avatar_url: null,
  store_name: null,
  phone: '+52 55 1234 5678',
};

export const MOCK_PRODUCTS = [
  {
    id: 'prod-uuid-1',
    card_name: 'Ragavan, Nimble Pilferer',
    card_number: '138',
    expansion_code: 'MH2',
    set: 'Modern Horizons 2',
    image_url:
      'https://cards.scryfall.io/normal/front/a/9/a9a54a1c-3f75-4f68-8b97-6f5test1.jpg',
    price_mxn: '2500.00',
    price_mxn_local: '2500.00',
    condition: { id: 'c1', name: 'NM', code: 'NM', display_name: 'Near Mint' },
    language: { id: 'l1', name: 'English', code: 'EN', display_name: 'English' },
    is_foil: false,
    stock: 3,
    is_local_inventory: true,
    owner: { id: 'u1', username: 'seller1', store_name: 'CardShop' },
    category: { name: 'SINGLES', display_name: 'Singles' },
    tags: [],
  },
  {
    id: 'prod-uuid-2',
    card_name: 'Liliana of the Veil',
    card_number: '105',
    expansion_code: 'ISD',
    set: 'Innistrad',
    image_url:
      'https://cards.scryfall.io/normal/front/b/8/b8efe8d1-ef0f-4f44-8d20-test2.jpg',
    price_mxn: '1800.00',
    price_mxn_local: '1800.00',
    condition: { id: 'c2', name: 'LP', code: 'LP', display_name: 'Lightly Played' },
    language: { id: 'l1', name: 'English', code: 'EN', display_name: 'English' },
    is_foil: false,
    stock: 1,
    is_local_inventory: true,
    owner: { id: 'u1', username: 'seller1', store_name: 'CardShop' },
    category: { name: 'SINGLES', display_name: 'Singles' },
    tags: [],
  },
  {
    id: 'prod-uuid-3',
    card_name: 'Wrenn and Six',
    card_number: '217',
    expansion_code: 'MH1',
    set: 'Modern Horizons',
    image_url:
      'https://cards.scryfall.io/normal/front/c/e/ce2b7b6e-test3.jpg',
    price_mxn: '3200.00',
    price_mxn_local: '3200.00',
    condition: { id: 'c1', name: 'NM', code: 'NM', display_name: 'Near Mint' },
    language: { id: 'l2', name: 'Japanese', code: 'JA', display_name: 'Japanese' },
    is_foil: true,
    stock: 2,
    is_local_inventory: true,
    owner: { id: 'u1', username: 'seller1', store_name: 'CardShop' },
    category: { name: 'SINGLES', display_name: 'Singles' },
    tags: [],
  },
];

export const MOCK_CART_ITEMS = [
  {
    id: 'cart-item-uuid-1',
    cartItemId: 'cart-item-uuid-1',
    title: 'Ragavan, Nimble Pilferer',
    image: MOCK_PRODUCTS[0].image_url,
    price: 2500,
    quantity: 1,
    stock: 3,
    expansion_code: 'MH2',
    condition: 'NM',
    language: 'EN',
    is_importation: false,
    single_id: 'prod-uuid-1',
  },
];

export const MOCK_ADDRESSES = [
  {
    id: 'addr-uuid-1',
    user_id: 'user-test-uuid-1',
    street: 'Av. Insurgentes Sur 1234',
    city: 'Ciudad de México',
    state: 'CDMX',
    zip_code: '03810',
    country: 'MX',
    receiver_name: 'Test Player',
    is_default: true,
  },
];

export const MOCK_ORDERS = [
  {
    id: 'order-uuid-1',
    status: 'PAID',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    internal_order_number: 'HC-001',
    items: [],
    importation_items: [],
    shipping: null,
    payments: [{ status: 'approved', payment_method: 'mercadopago' }],
  },
  {
    id: 'order-uuid-2',
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    internal_order_number: 'HC-002',
    items: [],
    importation_items: [],
    shipping: null,
    payments: [{ status: 'approved', payment_method: 'wallet' }],
  },
];

export const MOCK_WALLET = {
  balance: 250.0,
  transactions: [
    {
      id: 'tx-1',
      amount: 250.0,
      type: 'ORDER_REFUND',
      description: 'Reembolso pedido HC-001',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ],
};

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

/**
 * Injects a fake authentication session before the page loads
 * and mocks the server-side auth endpoints.
 * Call this BEFORE page.goto().
 */
export async function setupAuthenticatedSession(page: Page): Promise<void> {
  const user = MOCK_USER;

  // Inject into localStorage before the page JS runs
  await page.addInitScript((u) => {
    try {
      localStorage.setItem('hydra_access_token', 'fake-jwt-access-token');
      localStorage.setItem('hydra_refresh_token', 'fake-jwt-refresh-token');
      localStorage.setItem('hydra_user', JSON.stringify(u));
      // Also try alternate keys in case the app uses different names
      localStorage.setItem('token', 'fake-jwt-access-token');
      localStorage.setItem('access_token', 'fake-jwt-access-token');
      sessionStorage.setItem('hydra_access_token', 'fake-jwt-access-token');
    } catch {}
  }, user);

  // Mock auth validation endpoints
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: user, statusCode: 200 }),
    });
  });

  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user, token: 'fake-jwt-access-token' }),
    });
  });

  await page.route('**/api/v1/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: user, statusCode: 200 }),
    });
  });

  // Mock refresh token
  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: { access_token: 'fake-jwt-access-token', user },
        statusCode: 200,
      }),
    });
  });
}

// ─── API Mocks ────────────────────────────────────────────────────────────────

export async function mockCartAPI(page: Page, empty = false): Promise<void> {
  const items = empty ? [] : MOCK_CART_ITEMS;
  const cartData = { id: 'cart-uuid-1', user_id: MOCK_USER.id, items };

  await page.route('**/api/v1/cart', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: cartData, statusCode: 200 }),
      });
    } else if (method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { success: true }, statusCode: 200 }),
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/v1/cart/summary**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          subtotal: empty ? 0 : 2500,
          shipping: 0,
          total: empty ? 0 : 2500,
          items: items.map((i) => ({
            id: i.id,
            unitPrice: i.price,
            outOfStock: false,
          })),
        },
        statusCode: 200,
      }),
    });
  });
}

export async function mockProductSearchAPI(
  page: Page,
  products = MOCK_PRODUCTS,
): Promise<void> {
  const payload = {
    data: {
      items: products,
      total: products.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
    statusCode: 200,
  };

  await page.route('**/api/v1/products/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });

  await page.route('**/api/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}

export async function mockOrdersAPI(page: Page): Promise<void> {
  await page.route('**/api/v1/orders', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_ORDERS, statusCode: 200 }),
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/v1/orders/*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_ORDERS[0], statusCode: 200 }),
      });
    } else {
      await route.continue();
    }
  });
}

export async function mockAddressesAPI(page: Page): Promise<void> {
  await page.route('**/api/v1/users/addresses**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_ADDRESSES, statusCode: 200 }),
      });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_ADDRESSES[0], statusCode: 201 }),
      });
    } else {
      await route.continue();
    }
  });
}

export async function mockWalletAPI(page: Page): Promise<void> {
  await page.route('**/api/v1/wallet**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: MOCK_WALLET, statusCode: 200 }),
    });
  });
}

export async function mockTcgsAndCategoriesAPI(page: Page): Promise<void> {
  const tcgs = [
    {
      id: 'tcg-1',
      name: 'magic',
      display_name: 'Magic: The Gathering',
      is_active: true,
      icon_url: '/icons/magic.png',
      logo_url: '/logos/magic.png',
      order: 1,
    },
    {
      id: 'tcg-2',
      name: 'pokemon',
      display_name: 'Pokémon',
      is_active: true,
      icon_url: '/icons/pokemon.png',
      logo_url: '/logos/pokemon.png',
      order: 2,
    },
  ];

  await page.route('**/api/v1/tcgs**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: tcgs, statusCode: 200 }),
    });
  });

  await page.route('**/api/v1/categories**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: 'cat-1', name: 'SINGLES', display_name: 'Singles', is_active: true, order: 1 },
          { id: 'cat-2', name: 'BUNDLES', display_name: 'Bundles', is_active: true, order: 2 },
        ],
        statusCode: 200,
      }),
    });
  });
}

// ─── Navigation Helpers ───────────────────────────────────────────────────────

export async function navigateAndWait(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
}

export async function navigateAndWaitIdle(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

// ─── Assertion Helpers ────────────────────────────────────────────────────────

export async function expectPageTitle(
  page: Page,
  pattern: string | RegExp,
): Promise<void> {
  const title = await page.title();
  if (pattern instanceof RegExp) {
    expect(title).toMatch(pattern);
  } else {
    expect(title).toContain(pattern);
  }
}

export async function expectHeadingVisible(
  page: Page,
  text: string | RegExp,
): Promise<void> {
  await expect(
    page.locator('h1, h2, h3').filter({ hasText: text }).first(),
  ).toBeVisible();
}

/**
 * Asserts that all fully-loaded <img> elements with a real src
 * have non-zero naturalWidth (i.e. they rendered successfully).
 */
export async function expectAllImagesLoaded(
  page: Page,
  selector = 'img[src]',
): Promise<void> {
  await page.waitForLoadState('load');

  const brokenSrcs = await page.evaluate((sel: string) => {
    return Array.from(document.querySelectorAll<HTMLImageElement>(sel))
      .filter(
        (img) =>
          img.complete &&
          img.naturalWidth === 0 &&
          !img.src.startsWith('data:') &&
          img.src.length > 0,
      )
      .map((img) => img.src);
  }, selector);

  expect(brokenSrcs, `Broken images: ${brokenSrcs.join(', ')}`).toHaveLength(0);
}

// ─── Input Helpers ────────────────────────────────────────────────────────────

export async function fillInput(
  page: Page,
  id: string,
  value: string,
): Promise<void> {
  await page.locator(`#${id}`).fill(value);
}

export async function clickButton(
  page: Page,
  text: string | RegExp,
): Promise<void> {
  await page.locator('button', { hasText: text }).first().click();
}

export async function isMobile(page: Page): Promise<boolean> {
  return (page.viewportSize()?.width ?? 1280) < 1024;
}

export function setMobileViewport(page: Page): Promise<void> {
  return page.setViewportSize({ width: 390, height: 844 });
}

export function setDesktopViewport(page: Page): Promise<void> {
  return page.setViewportSize({ width: 1280, height: 800 });
}
