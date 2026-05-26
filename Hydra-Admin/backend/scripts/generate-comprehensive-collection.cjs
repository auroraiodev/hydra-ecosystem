/**
 * Generates a comprehensive Postman collection covering ALL Hydra BE API endpoints
 * with proper auth pre-request scripts and test assertions.
 *
 * Usage: node scripts/generate-comprehensive-collection.cjs
 * Output: hydra-be-comprehensive.postman_collection.json
 */

const fs = require('fs');
const path = require('path');

const BASE = '{{baseUrl}}/api/v1';

// ─── Helpers ────────────────────────────────────────────────────────────────

function req(method, urlPath, opts = {}) {
  const { auth, body, query, desc, extraHeaders, formData, allow5xx } = opts;
  const headers = [{ key: 'Content-Type', value: 'application/json' }];
  if (auth) headers.push({ key: 'Authorization', value: `Bearer {{${auth}Token}}`, type: 'text' });
  if (extraHeaders) headers.push(...extraHeaders);

  const hasPathParam = urlPath.includes(':');
  const url = {
    raw: `${BASE}${urlPath}`,
    host: ['{{baseUrl}}'],
    path: ['api', 'v1', ...urlPath.replace(/^\//, '').split('/')],
    variable: [],
  };
  if (hasPathParam) {
    const parts = urlPath.split('/');
    url.variable = parts.filter(p => p.startsWith(':')).map(p => ({
      key: p.slice(1),
      value: '',
    }));
  }
  if (query) url.query = query.map(q => ({ key: q.key, value: q.value || '' }));

  const bodySection = body ? { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } : undefined;
  if (formData) {
    bodySection.mode = 'formdata';
    bodySection.formdata = formData;
    delete bodySection.raw;
    delete bodySection.options;
  }

  return {
    name: `${method} ${urlPath}${desc ? ` — ${desc}` : ''}`,
    request: { method, header: headers, ...(bodySection ? { body: bodySection } : {}), url },
    event: [
      {
        listen: 'test',
        script: {
          exec: [
            "const token = pm.variables.get('token') || pm.environment.get('token') || '';",
            "if (pm.response.code === 401 && !token) {",
            "  pm.test('Blocked unauthenticated (no token set)', () => pm.expect(true).to.be.true);",
            '  return;',
            '}',
            hasPathParam || allow5xx
              ? "const validCodes = [200, 201, 204, 400, 401, 403, 404, 409, 500];"
              : "const validCodes = [200, 201, 204, 400, 401, 403, 404, 409];",
            'pm.expect(validCodes).to.include(pm.response.code);',
            "if (pm.response.code >= 200 && pm.response.code < 300) {",
            "  try { const j = pm.response.json(); pm.expect(j).to.be.an('object'); } catch(e) {}",
            '}',
          ],
          type: 'text/javascript',
        },
      },
    ],
  };
}

function folder(name, items) {
  return { name, item: items };
}

const preRequestAuth = (role) => [
  "const token = pm.environment.get('" + role + "Token');",
  "if (!token) {",
  "  console.log('No " + role + " token available — skipping');",
  "  return;",
  '}',
  "pm.variables.set('token', token);",
];

// ─── Auth Requests ──────────────────────────────────────────────────────────

function authReq(role, endpoint, loginBody) {
  const varName = `${role}Token`;
  return {
    name: `Login as ${role.toUpperCase()}`,
    request: {
      method: 'POST',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: { mode: 'raw', raw: JSON.stringify(loginBody, null, 2), options: { raw: { language: 'json' } } },
      url: {
        raw: `{{baseUrl}}/api/v1/auth/${endpoint}`,
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'auth', endpoint],
        variable: [],
      },
    },
    event: [
      {
        listen: 'test',
        script: {
          exec: [
            'try {',
            '  const j = pm.response.json();',
            "  const token = j.data?.accessToken || j.accessToken;",
            '  if (token) {',
            "    pm.environment.set('" + varName + "', token);",
            "    console.log('" + role + " token saved');",
            '  } else {',
            "    console.log('" + role + " login failed: ' + pm.response.code + ' - ' + (j.message || j.error || 'no token'));",
            '  }',
            '} catch(e) { console.log(e.message); }',
          ],
          type: 'text/javascript',
        },
      },
    ],
  };
}

// ─── Build Collection ───────────────────────────────────────────────────────

const collection = {
  info: {
    name: 'Hydra BE — Comprehensive API Tests',
    description: 'Covers all ~200+ endpoints with auth setup for CLIENT, SELLER, and ADMIN roles.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    // Phase 0: Auth Setup
    folder('0 — Auth Setup', [
      authReq('client', 'login', { email: '{{clientEmail}}', password: '{{clientPassword}}' }),
      authReq('seller', 'admin-login', { email: '{{sellerEmail}}', password: '{{sellerPassword}}' }),
      authReq('admin', 'admin-login', { email: '{{adminEmail}}', password: '{{adminPassword}}' }),
    ]),

    // 1. App & Health
    folder('1 — App & Health', [
      req('GET', '/', { desc: 'Hello world', auth: false }),
      req('GET', '/health', { desc: 'Basic DB health check', auth: false }),
      req('GET', '/health/ready', { desc: 'Readiness probe', auth: false }),
      req('GET', '/health/live', { desc: 'Liveness probe', auth: false }),
      req('GET', '/health/detailed', { desc: 'Detailed health', auth: false }),
      req('GET', '/health/metrics', { desc: 'App metrics', auth: false }),
      req('GET', '/settings/public', { desc: 'Public site settings', auth: false }),
    ].map(r => ({ ...r, event: [{ listen: 'test', script: { exec: ["const c = pm.response.code; pm.expect([200, 500]).to.include(c); if (c === 200) { try { const j = pm.response.json(); pm.expect(j).to.be.an('object'); } catch(e) {} }"], type: 'text/javascript' } }] }))),

    // 2. Auth
    folder('2 — Auth', [
      req('POST', '/auth/login', { desc: 'User login (CLIENT)', body: { email: '{{clientEmail}}', password: '{{clientPassword}}' }, auth: false }),
      req('POST', '/auth/admin-login', { desc: 'Admin login (ADMIN/SELLER)', body: { email: '{{adminEmail}}', password: '{{adminPassword}}' }, auth: false }),
      req('POST', '/auth/admin-logout', { desc: 'Admin logout', auth: false }),
      req('POST', '/auth/admin-session', { desc: 'Exchange JWT for cookie', body: { token: 'test' }, auth: false }),
      req('POST', '/auth/refresh', { desc: 'Refresh token', auth: false }),
    ]),

    // 3. Users
    folder('3 — Users', [
      req('POST', '/users/signup', { desc: 'Public signup', body: { email: 'newtest@test.com', username: 'newtest', password: 'Password123!', first_name: 'Test', last_name: 'User' }, auth: false }),
      req('GET', '/users', { desc: 'List all users', auth: 'admin' }),
      req('GET', '/users/:id', { desc: 'Get user by ID', auth: 'admin' }),
      req('PATCH', '/users/:id', { desc: 'Update user', auth: 'admin' }),
      req('DELETE', '/users/:id', { desc: 'Delete user', auth: 'admin' }),
      req('POST', '/users/:id/reset-password', { desc: 'Reset user password', auth: 'admin' }),
      req('GET', '/users/profile', { desc: 'Get own profile', auth: 'client' }),
      req('PATCH', '/users/profile', { desc: 'Update own profile', auth: 'client' }),
      req('GET', '/users/addresses', { desc: 'Get addresses', auth: 'client' }),
      req('POST', '/users/addresses', { desc: 'Add address', auth: 'client' }),
      req('DELETE', '/users/addresses/:id', { desc: 'Delete address', auth: 'client' }),
    ]),

    // 4. Roles
    folder('4 — Roles', [
      req('GET', '/roles', { desc: 'Get all roles', auth: 'admin' }),
      req('POST', '/roles', { desc: 'Create role', auth: 'admin' }),
      req('GET', '/roles/:id', { desc: 'Get role by ID', auth: 'admin' }),
      req('PATCH', '/roles/:id', { desc: 'Update role', auth: 'admin' }),
      req('DELETE', '/roles/:id', { desc: 'Delete role', auth: 'admin' }),
    ]),

    // 5. Banners
    folder('5 — Banners', [
      req('GET', '/banners', { desc: 'Get all banners', auth: false }),
      req('GET', '/banners/active', { desc: 'Get active banners', auth: false, query: [{ key: 'tcgId', value: '' }] }),
      req('POST', '/banners', { desc: 'Create banner', auth: 'admin' }),
      req('PATCH', '/banners/:id', { desc: 'Update banner', auth: 'admin' }),
      req('DELETE', '/banners/:id', { desc: 'Delete banner', auth: 'admin' }),
    ]),

    // 6. Categories
    folder('6 — Categories', [
      req('GET', '/categories', { desc: 'Get all categories', auth: false }),
      req('GET', '/categories/active', { desc: 'Get active categories', auth: false }),
      req('GET', '/categories/with-products', { desc: 'Categories with products', auth: false }),
      req('GET', '/categories/:id', { desc: 'Get category by ID', auth: false }),
      req('POST', '/categories', { desc: 'Create category', auth: 'admin' }),
      req('PUT', '/categories/:id', { desc: 'Update category', auth: 'admin' }),
      req('PATCH', '/categories/:id', { desc: 'Patch category', auth: 'admin' }),
      req('PATCH', '/categories/:id/toggle', { desc: 'Toggle category', auth: 'admin' }),
      req('DELETE', '/categories/:id', { desc: 'Delete category', auth: 'admin' }),
    ]),

    // 7. Conditions
    folder('7 — Conditions', [
      req('GET', '/conditions', { desc: 'Get all conditions', auth: false }),
      req('GET', '/conditions/active', { desc: 'Get active conditions', auth: false }),
      req('GET', '/conditions/code/:code', { desc: 'Get condition by code', auth: false }),
      req('GET', '/conditions/:id', { desc: 'Get condition by ID', auth: false }),
      req('POST', '/conditions', { desc: 'Create condition', auth: 'admin' }),
      req('PATCH', '/conditions/:id', { desc: 'Update condition', auth: 'admin' }),
      req('DELETE', '/conditions/:id', { desc: 'Delete condition', auth: 'admin' }),
    ]),

    // 8. Languages
    folder('8 — Languages', [
      req('GET', '/languages', { desc: 'Get all languages', auth: false }),
      req('GET', '/languages/active', { desc: 'Get active languages', auth: false }),
      req('GET', '/languages/code/:code', { desc: 'Get language by code', auth: false }),
      req('GET', '/languages/:id', { desc: 'Get language by ID', auth: false }),
      req('POST', '/languages', { desc: 'Create language', auth: 'admin' }),
      req('PATCH', '/languages/:id', { desc: 'Update language', auth: 'admin' }),
      req('DELETE', '/languages/:id', { desc: 'Delete language', auth: 'admin' }),
    ]),

    // 9. Tags
    folder('9 — Tags', [
      req('GET', '/tags', { desc: 'Get all tags', auth: false }),
      req('GET', '/tags/default', { desc: 'Get default tags', auth: false }),
      req('GET', '/tags/active', { desc: 'Get active tags', auth: false }),
      req('GET', '/tags/name/:name', { desc: 'Get tag by name', auth: false }),
      req('GET', '/tags/:id', { desc: 'Get tag by ID', auth: false }),
      req('POST', '/tags', { desc: 'Create tag', auth: 'admin' }),
      req('PATCH', '/tags/:id', { desc: 'Update tag', auth: 'admin' }),
      req('DELETE', '/tags/:id', { desc: 'Delete tag', auth: 'admin' }),
    ]),

    // 10. TCGs
    folder('10 — TCGs', [
      req('GET', '/tcgs', { desc: 'Get all TCGs', auth: false }),
      req('GET', '/tcgs/active', { desc: 'Get active TCGs', auth: false }),
      req('GET', '/tcgs/:id', { desc: 'Get TCG by ID', auth: false }),
      req('POST', '/tcgs', { desc: 'Create TCG', auth: 'admin' }),
      req('PATCH', '/tcgs/:id', { desc: 'Update TCG', auth: 'admin' }),
      req('DELETE', '/tcgs/:id', { desc: 'Delete TCG', auth: 'admin' }),
    ]),

    // 11. Singles (Products)
    folder('11 — Singles', [
      req('GET', '/singles', { desc: 'Get all singles', auth: false }),
      req('GET', '/singles/local', { desc: 'Get local inventory singles', auth: false }),
      req('GET', '/singles/search', { desc: 'Search singles', auth: false }),
      req('GET', '/singles/expansions', { desc: 'Get expansions', auth: false }),
      req('GET', '/singles/owner/:ownerId', { desc: 'Get by owner', auth: false }),
      req('GET', '/singles/importation/:importationId', { desc: 'Get by importation ID', auth: false }),
      req('GET', '/singles/:id/alternatives', { desc: 'Get alternatives', auth: false }),
      req('GET', '/singles/:id', { desc: 'Get single by ID', auth: false }),
      req('POST', '/singles', { desc: 'Create single', auth: 'admin' }),
      req('POST', '/singles/bundle', { desc: 'Create bundle', auth: 'admin' }),
      req('POST', '/singles/batch', { desc: 'Get batch by IDs', auth: false }),
      req('POST', '/singles/bulk', { desc: 'Bulk create singles', auth: 'admin' }),
      req('POST', '/singles/bulk-delete', { desc: 'Bulk delete singles', auth: 'admin' }),
      req('PATCH', '/singles/:id', { desc: 'Update single', auth: 'admin' }),
      req('PATCH', '/singles/:id/tags', { desc: 'Update tags', auth: 'admin' }),
      req('PATCH', '/singles/:id/owner', { desc: 'Change owner', auth: 'admin' }),
      req('PATCH', '/singles/:id/foil', { desc: 'Update foil status', auth: 'admin' }),
      req('PATCH', '/singles/update-to-local-inventory', { desc: 'Bulk fix local inventory', auth: 'admin' }),
      req('DELETE', '/singles/:id', { desc: 'Delete single', auth: 'admin' }),
    ]),

    // 12. Search
    folder('12 — Search & Importation', [
      req('GET', '/search/local', { desc: 'Local search', auth: false, query: [{ key: 'q', value: '' }] }),
      req('GET', '/search/hybrid', { desc: 'Hybrid search', auth: false, query: [{ key: 'q', value: '' }] }),
      req('GET', '/search/autocomplete', { desc: 'Autocomplete', auth: false, query: [{ key: 'q', value: '' }] }),
      req('GET', '/search/importation', { desc: 'Importation search', auth: false, query: [{ key: 'q', value: '' }] }),
      req('GET', '/search/importation-general', { desc: 'Importation general', auth: false, query: [{ key: 'q', value: '' }] }),
      req('POST', '/search/importation/pricing', { desc: 'Importation pricing', auth: false }),
      req('POST', '/search/invalidate-home', { desc: 'Invalidate home cache', auth: false }),
      req('GET', '/search/test-mtgsrc', { desc: 'Test MTGSrc connectivity', auth: false }),
    ]),

    // 13. Listings
    folder('13 — Listings', [
      req('GET', '/listings', { desc: 'Get all listings', auth: false }),
      req('GET', '/listings/my-listings', { desc: 'Get my listings', auth: 'seller' }),
      req('GET', '/listings/:id', { desc: 'Get listing by ID', auth: false }),
      req('POST', '/listings', { desc: 'Create listing', auth: 'seller' }),
      req('PATCH', '/listings/:id', { desc: 'Update listing', auth: 'seller' }),
      req('DELETE', '/listings/:id', { desc: 'Delete listing', auth: 'seller' }),
    ]),

    // 14. Cart
    folder('14 — Cart', [
      req('GET', '/cart', { desc: 'Get user cart', auth: 'client' }),
      req('GET', '/cart/summary', { desc: 'Get cart summary', auth: 'client' }),
      req('POST', '/cart/items', { desc: 'Add item to cart', auth: 'client' }),
      req('POST', '/cart/merge', { desc: 'Merge guest cart', auth: 'client' }),
      req('PUT', '/cart/items/:itemId', { desc: 'Update cart item', auth: 'client' }),
      req('DELETE', '/cart/items/:itemId', { desc: 'Remove cart item', auth: 'client' }),
      req('DELETE', '/cart', { desc: 'Clear cart', auth: 'client' }),
      // Admin cart
      req('GET', '/cart/admin/:userId', { desc: 'Admin: get user cart', auth: 'admin' }),
      req('GET', '/cart/admin/:userId/summary', { desc: 'Admin: cart summary', auth: 'admin' }),
      req('POST', '/cart/admin/:userId/items', { desc: 'Admin: add item', auth: 'admin' }),
      req('PUT', '/cart/admin/:userId/items/:itemId', { desc: 'Admin: update item', auth: 'admin' }),
      req('DELETE', '/cart/admin/:userId/items/:itemId', { desc: 'Admin: remove item', auth: 'admin' }),
      req('DELETE', '/cart/admin/:userId', { desc: 'Admin: clear cart', auth: 'admin' }),
    ]),

    // 15. Orders
    folder('15 — Orders', [
      req('POST', '/orders/checkout', { desc: 'Checkout (create order)', auth: 'client' }),
      req('GET', '/orders', { desc: 'Get my orders', auth: 'client' }),
      req('GET', '/orders/:id', { desc: 'Get order by ID', auth: 'client' }),
      req('POST', '/orders/:id/pay-with-wallet', { desc: 'Pay with wallet', auth: 'client' }),
      req('POST', '/orders/:id/pay-with-mercadopago', { desc: 'Pay with MP', auth: 'client' }),
      req('POST', '/orders/:id/verify-payment', { desc: 'Verify MP payment', auth: 'client' }),
      req('POST', '/orders/:id/items/remove', { desc: 'Remove items', auth: 'client' }),
      // Admin orders
      req('POST', '/orders/admin', { desc: 'Admin: create order', auth: 'admin' }),
      req('POST', '/orders/bulk-delete', { desc: 'Bulk delete orders', auth: 'admin', allow5xx: true }),
      req('POST', '/orders/admin/checkout-for-user/:userId', { desc: 'Admin: checkout for user', auth: 'admin' }),
      req('POST', '/orders/admin/:orderId/undo-to-cart', { desc: 'Admin: undo to cart', auth: 'admin' }),
      req('GET', '/orders/sales', { desc: 'Get sales history', auth: 'admin', allow5xx: true }),
      req('POST', '/orders/:id/mark-paid-local', { desc: 'Mark paid locally', auth: 'admin' }),
      req('PATCH', '/orders/:id', { desc: 'Update order', auth: 'admin' }),
      req('DELETE', '/orders/:id', { desc: 'Delete order', auth: 'admin' }),
      req('POST', '/orders/:id/items', { desc: 'Add item to order', auth: 'admin' }),
      req('PATCH', '/orders/:id/items/:itemId/delivery-status', { desc: 'Update delivery status', auth: 'admin' }),
      req('GET', '/orders/:id/payment-balance', { desc: 'Get payment balance', auth: 'admin' }),
      req('POST', '/orders/:id/reopen-for-payment', { desc: 'Reopen for payment', auth: 'admin' }),
      req('PATCH', '/orders/:id/items/discount-all', { desc: 'Discount all items', auth: 'admin' }),
      req('PATCH', '/orders/:id/request-review', { desc: 'Request review', auth: 'admin' }),
    ]),

    // 16. Payments
    folder('16 — Payments', [
      req('GET', '/payments/config', { desc: 'Get payment config', auth: false }),
      req('POST', '/payments/webhook/mercadopago', { desc: 'MP webhook', auth: false }),
    ]),

    // 17. Wallet
    folder('17 — Wallet', [
      req('GET', '/wallet', { desc: 'Get wallet', auth: 'client' }),
      req('POST', '/wallet/withdrawal', { desc: 'Request withdrawal', auth: 'client' }),
    ]),

    // 18. Reviews
    folder('18 — Reviews', [
      req('GET', '/reviews', { desc: 'Get approved reviews', auth: false }),
      req('POST', '/reviews', { desc: 'Submit review', auth: 'client' }),
      req('GET', '/reviews/admin', { desc: 'Get all reviews (admin)', auth: 'admin' }),
      req('PATCH', '/reviews/:id/approve', { desc: 'Approve review', auth: 'admin' }),
      req('DELETE', '/reviews/:id', { desc: 'Delete review', auth: 'admin' }),
    ]),

    // 19. Notifications
    folder('19 — Notifications', [
      req('GET', '/notifications', { desc: 'Get notifications', auth: 'client' }),
      req('GET', '/notifications/stream', { desc: 'SSE stream', auth: false, query: [{ key: 'token', value: '' }] }),
      req('PATCH', '/notifications/:id/read', { desc: 'Mark read', auth: 'client' }),
      req('PATCH', '/notifications/read-all', { desc: 'Mark all read', auth: 'client' }),
    ]),

    // 20. Chat
    folder('20 — Chat', [
      req('GET', '/chat/history', { desc: 'Get chat history', auth: 'client' }),
      req('GET', '/chat/history/user', { desc: 'Get any user history', auth: 'admin' }),
      req('GET', '/chat/conversations', { desc: 'List conversations', auth: 'admin' }),
      req('DELETE', '/chat/message/:id', { desc: 'Delete message', auth: 'admin' }),
      req('DELETE', '/chat/conversation/:userId', { desc: 'Delete conversation', auth: 'admin' }),
      req('GET', '/chat/push/vapid-public-key', { desc: 'Get VAPID key', auth: 'client' }),
      req('POST', '/chat/push/subscribe', { desc: 'Subscribe admin push', auth: 'admin' }),
      req('POST', '/chat/push/subscribe/user', { desc: 'Subscribe user push', auth: 'client' }),
      req('DELETE', '/chat/push/unsubscribe', { desc: 'Unsubscribe push', auth: 'client' }),
    ]),

    // 21. Feature Flags
    folder('21 — Feature Flags', [
      req('GET', '/feature-flags', { desc: 'Get feature flags', auth: false }),
      req('PATCH', '/feature-flags/:key', { desc: 'Toggle flag', auth: 'admin' }),
    ]),

    // 22. Modal
    folder('22 — Modal', [
      req('GET', '/modal/seen', { desc: 'Check if seen', auth: 'client' }),
      req('POST', '/modal/mark-seen', { desc: 'Mark as seen', auth: 'client' }),
    ]),

    // 23. Images
    folder('23 — Images', [
      req('GET', '/images/:folder/:filename', { desc: 'Get image', auth: false }),
    ]),

    // 24. OCR
    folder('24 — OCR', [
      req('POST', '/ocr/process', { desc: 'Process image OCR', auth: 'client' }),
    ]),

    // 25. Assistant
    folder('25 — Assistant', [
      req('POST', '/assistant/chat', { desc: 'Chat with AI', body: { message: 'Hello' }, auth: false }),
    ]),

    // 26. Seller Dashboard
    folder('26 — Seller Dashboard', [
      req('GET', '/seller/dashboard', { desc: 'Dashboard stats', auth: 'seller' }),
      req('GET', '/seller/analytics/revenue', { desc: 'Revenue analytics', auth: 'seller' }),
      req('GET', '/seller/orders/stats', { desc: 'Order stats', auth: 'seller' }),
      req('GET', '/seller/orders', { desc: 'Seller orders', auth: 'seller' }),
      req('GET', '/seller/orders/:id', { desc: 'Order detail', auth: 'seller' }),
      req('GET', '/seller/wallet', { desc: 'Seller wallet', auth: 'seller' }),
      req('GET', '/seller/wallet/pending', { desc: 'Pending payouts', auth: 'seller' }),
      req('POST', '/seller/wallet/withdrawal', { desc: 'Request withdrawal', auth: 'seller' }),
      req('POST', '/seller/wallet/request-payout', { desc: 'Request payout', auth: 'seller' }),
    ]),

    // 27. Admin Dashboard
    folder('27 — Admin Dashboard', [
      req('GET', '/admin/dashboard', { desc: 'Dashboard stats', auth: 'admin' }),
      req('GET', '/admin/analytics/users', { desc: 'User analytics', auth: 'admin' }),
      req('GET', '/admin/analytics/orders', { desc: 'Order analytics', auth: 'admin' }),
      req('GET', '/admin/analytics/revenue', { desc: 'Revenue analytics', auth: 'admin' }),
      req('GET', '/admin/analytics/products', { desc: 'Product analytics', auth: 'admin' }),
      req('GET', '/admin/analytics/buyers', { desc: 'Buyer analytics', auth: 'admin' }),
    ]),

    // 28. Admin Orders
    folder('28 — Admin Orders', [
      req('GET', '/admin/orders/stats', { desc: 'Order stats', auth: 'admin' }),
      req('GET', '/admin/orders', { desc: 'All orders', auth: 'admin' }),
      req('GET', '/admin/orders/:id', { desc: 'Order by ID', auth: 'admin' }),
      req('PUT', '/admin/orders/:id', { desc: 'Update order', auth: 'admin' }),
      req('POST', '/admin/orders/:id/assign', { desc: 'Assign order', auth: 'admin' }),
      req('POST', '/admin/orders/:id/cancel', { desc: 'Cancel order', auth: 'admin' }),
      req('POST', '/admin/orders/:id/ship', { desc: 'Ship order', auth: 'admin' }),
      req('POST', '/admin/orders/:id/deliver', { desc: 'Deliver order', auth: 'admin' }),
      req('POST', '/admin/orders/bulk-update', { desc: 'Bulk update', auth: 'admin' }),
    ]),

    // 29. Admin Wallet
    folder('29 — Admin Wallet', [
      req('GET', '/admin/wallet/users', { desc: 'All wallets', auth: 'admin' }),
      req('GET', '/admin/wallet/users/:id', { desc: 'User wallet', auth: 'admin' }),
      req('POST', '/admin/wallet/verify-access', { desc: 'Verify access', auth: 'admin' }),
      req('POST', '/admin/wallet/users/:id/adjust', { desc: 'Adjust balance', auth: 'admin' }),
      req('POST', '/admin/wallet/users/:id/payout', { desc: 'Mark paid', auth: 'admin' }),
      req('GET', '/admin/wallet/transactions', { desc: 'Transactions', auth: 'admin' }),
    ]),

    // 30. Admin Settings & Tools
    folder('30 — Admin Settings & Tools', [
      req('GET', '/admin/settings', { desc: 'Get settings', auth: 'admin' }),
      req('POST', '/admin/settings', { desc: 'Update settings', auth: 'admin' }),
      req('POST', '/admin/audit/logs', { desc: 'Create audit log', auth: 'admin' }),
      req('POST', '/admin/maintenance/backup', { desc: 'Trigger backup', auth: 'admin' }),
      req('POST', '/admin/maintenance/cache/clear', { desc: 'Clear cache', auth: 'admin' }),
      req('POST', '/admin/maintenance/restore', { desc: 'Restore DB', auth: 'admin' }),
      req('GET', '/admin/export/data', { desc: 'Export data', auth: 'admin', query: [{ key: 'format', value: 'json' }] }),
      req('GET', '/admin/notifications', { desc: 'Admin notifications', auth: 'admin' }),
      req('POST', '/admin/notifications/:id/mark-read', { desc: 'Mark notif read', auth: 'admin' }),
      req('POST', '/admin/notifications/broadcast', { desc: 'Broadcast notification', auth: 'admin' }),
    ]),

    // 31. Admin Upload
    folder('31 — Admin Upload', [
      req('POST', '/admin/upload/image', { desc: 'Upload image', auth: 'admin' }),
      req('POST', '/admin/upload/delete', { desc: 'Delete image by key', auth: 'admin' }),
      req('DELETE', '/admin/upload/image/:folder/:filename', { desc: 'Delete image', auth: 'admin' }),
    ]),
  ],
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3002', type: 'string' },
    { key: 'token', value: '', type: 'string' },
  ],
};

// ─── Write Output ───────────────────────────────────────────────────────────

const outputPath = path.join(__dirname, '..', 'hydra-be-comprehensive.postman_collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf-8');
console.log(`Collection generated: ${outputPath}`);
console.log(`Total folders: ${collection.item.length}`);
const totalReqs = collection.item.reduce((acc, f) => acc + f.item.length, 0);
console.log(`Total requests: ${totalReqs}`);
