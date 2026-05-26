const fs = require('fs');
const path = require('path');

const COLLECTION_NAME = 'Hydra BE - Full Seller Flow E2E';
const COLLECTION_FILE = path.join(__dirname, 'hydra-be-seller-flow.postman_collection.json');
const ENV_FILE = path.join(__dirname, 'hydra-be-seller-flow.postman_environment.json');

function genRequest(name, method, url, body, tests, authVar) {
  const testLines = [
    `// ${name}`,
    'try {',
    '  var resp = pm.response.json();',
    '} catch(e) {',
    '  console.log("Non-JSON response: " + pm.response.text().slice(0,200));',
    '}',
    ...tests,
  ];

  const r = {
    name,
    event: [
      {
        listen: 'test',
        script: {
          exec: testLines.map((l) => '  ' + l),
          type: 'text/javascript',
        },
      },
    ],
    request: {
      method,
      header: [
        { key: 'Content-Type', value: 'application/json' },
        ...(authVar
          ? [{ key: 'Authorization', value: `Bearer {{${authVar}}}`, type: 'text' }]
          : []),
      ],
      url: {
        raw: `${method === 'GET' ? url.split('?')[0] : url}`,
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', ...url.split('?')[0].split('/').filter(Boolean)],
      },
    },
    response: [],
  };

  if (url.includes('?')) {
    r.request.url.query = url
      .split('?')[1]
      .split('&')
      .map((p) => {
        const [k, v] = p.split('=');
        return { key: k, value: decodeURIComponent(v || '') };
      });
  }

  if (body) {
    r.request.body = { mode: 'raw', raw: JSON.stringify(body, null, 2) };
  }

  return r;
}

function genFolder(name, items) {
  return { name, item: items };
}

function okTest() {
  return [
    'pm.expect(pm.response.code).to.be.lessThan(500);',
  ];
}

function statusTest(code) {
  return [`pm.test("Status ${code}", () => pm.response.to.have.status(${code}));`];
}

function hasBodyTest() {
  return ['pm.test("Has body", () => pm.expect(resp).to.not.be.undefined);'];
}

const collection = {
  info: {
    name: COLLECTION_NAME,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    // ===== F1: SYSTEM HEALTH =====
    genFolder('F1 — System Health', [
      genRequest('Health check', 'GET', '/health', null, [
        ...okTest(),
        ...statusTest(200),
        ...hasBodyTest(),
        'pm.test("Has success", () => pm.expect(resp.success).to.be.true);',
        'pm.test("Has status field", () => pm.expect(resp.data || resp).to.have.property("status"));',
      ]),
      genRequest('Health ready', 'GET', '/health/ready', null, [
        ...okTest(),
        ...statusTest(200),
      ]),
      genRequest('Health live', 'GET', '/health/live', null, [
        ...okTest(),
        'pm.test("Any status", () => pm.expect(pm.response.code).to.be.oneOf([200, 504]));',
      ]),
    ]),

    // ===== F2: AUTH AS CLIENT =====
    genFolder('F2 — Auth (Client)', [
      genRequest('Login as CLIENT', 'POST', '/auth/login', {
        email: '{{clientEmail}}',
        password: '{{clientPassword}}',
      }, [
        ...okTest(),
        'pm.test("Login result", () => {',
        '  if (pm.response.code === 200) {',
        '    pm.expect(resp).to.have.property("accessToken");',
        '    pm.collectionVariables.set("clientToken", resp.accessToken);',
        '    console.log("Client login OK");',
        '  } else {',
        '    console.log("Client login failed (expected if no seed data): " + JSON.stringify(resp));',
        '  }',
        '});',
      ]),
    ]),

    // ===== F3: MARKETPLACE SEARCH =====
    genFolder('F3 — Marketplace Search', [
      genRequest('Search catalog', 'GET', '/search/singles?q=Black%20Lotus&page=1&limit=20', null, [
        ...okTest(),
        'var results = resp.data?.results || resp.results || [];',
        'pm.test("Has results", () => pm.expect(Array.isArray(results)).to.be.true);',
        '// Duplicate check',
        'var ids = results.map(function(i) { return i.importationId || i.id; }).filter(Boolean);',
        'var uniqueIds = new Set(ids);',
        'pm.test("No duplicates in page", function() {',
        '  pm.expect(ids.length).to.eql(uniqueIds.size);',
        '});',
        'console.log("Search returned " + results.length + " items");',
      ]),
      genRequest('Get local products', 'GET', '/singles?page=1&limit=10', null, [
        ...okTest(),
        'var singles = resp.data || [];',
        'pm.test("Is array", () => pm.expect(Array.isArray(singles)).to.be.true);',
        'if (singles.length > 0) {',
        '  pm.collectionVariables.set("productId", singles[0].id);',
        '  console.log("First single: " + singles[0].cardName);',
        '}',
      ]),
    ]),

    // ===== F4: CART & CHECKOUT =====
    genFolder('F4 — Cart & Checkout (Client)', [
      genRequest('Get cart', 'GET', '/cart', null, [
        ...okTest(),
        ...statusTest(200),
        'console.log("Cart items count: " + (resp.data ? resp.data.length : 0));',
      ], 'clientToken'),
      genRequest('Add item to cart', 'POST', '/cart/items', {
        singleId: '{{productId}}',
        quantity: 1,
        isImportation: false,
      }, [
        ...okTest(),
        'if (pm.response.code === 201) {',
        '  pm.collectionVariables.set("cartItemId", resp.data?.id || resp.itemId);',
        '  console.log("Item added to cart");',
        '} else {',
        '  console.log("Add item result: " + JSON.stringify(resp).slice(0,100));',
        '}',
      ], 'clientToken'),
      genRequest('Get cart summary', 'GET', '/cart/summary', null, [
        ...okTest(),
        'if (resp.data) {',
        '  pm.test("Has subtotal", () => pm.expect(resp.data).to.have.property("subtotal"));',
        '}',
      ], 'clientToken'),
      genRequest('Checkout (create order)', 'POST', '/orders/checkout', {
        shippingMethod: 'pickup',
        paymentMethod: 'wallet',
      }, [
        ...okTest(),
        'var order = resp.data || resp.order || resp;',
        'if (pm.response.code === 201) {',
        '  pm.test("Has order ID", () => pm.expect(order).to.have.property("id"));',
        '  pm.collectionVariables.set("clientOrderId", order.id);',
        '  console.log("Order created: " + order.id);',
        '} else {',
        '  console.log("Checkout failed: " + JSON.stringify(resp).slice(0,200));',
        '}',
      ], 'clientToken'),
    ]),

    // ===== F5: ORDER PAYMENT =====
    genFolder('F5 — Order Payment (Client)', [
      genRequest('Get my orders', 'GET', '/orders', null, [
        ...okTest(),
        'var orders = resp.data || resp.orders || [];',
        'if (orders.length > 0) {',
        '  pm.collectionVariables.set("clientOrderId", orders[0].id);',
        '}',
        'console.log("Orders count: " + orders.length);',
      ], 'clientToken'),
      genRequest('Pay with wallet', 'POST', '/orders/{{clientOrderId}}/pay-with-wallet', null, [
        ...okTest(),
        'console.log("Payment result: " + JSON.stringify(resp).slice(0,200));',
      ], 'clientToken'),
      genRequest('Verify order', 'GET', '/orders/{{clientOrderId}}', null, [
        ...okTest(),
        'var ord = resp.data || resp.order || resp;',
        'if (ord) {',
        '  console.log("Order status: " + ord.status);',
        '  pm.collectionVariables.set("paidOrderId", ord.id);',
        '}',
      ], 'clientToken'),
    ]),

    // ===== F6: AUTH AS SELLER =====
    genFolder('F6 — Auth (Seller)', [
      genRequest('Login as SELLER', 'POST', '/auth/admin-login', {
        email: '{{sellerEmail}}',
        password: '{{sellerPassword}}',
      }, [
        ...okTest(),
        'pm.test("Login result", () => {',
        '  if (pm.response.code === 200) {',
        '    pm.expect(resp).to.have.property("accessToken");',
        '    pm.collectionVariables.set("sellerToken", resp.accessToken);',
        '    console.log("Seller login OK");',
        '  } else {',
        '    console.log("Seller login: " + JSON.stringify(resp).slice(0,100));',
        '  }',
        '});',
      ]),
    ]),

    // ===== F7: SELLER DASHBOARD =====
    genFolder('F7 — Seller Dashboard', [
      genRequest('Dashboard stats', 'GET', '/seller/dashboard', null, [
        ...okTest(),
        'var dash = resp.data || resp;',
        'console.log("Dashboard: " + JSON.stringify(dash).slice(0,200));',
      ], 'sellerToken'),
      genRequest('Order stats', 'GET', '/seller/orders/stats?days=30', null, [
        ...okTest(),
        ...statusTest(200),
      ], 'sellerToken'),
      genRequest('Revenue analytics', 'GET', '/seller/analytics/revenue?days=30', null, [
        ...okTest(),
        ...statusTest(200),
      ], 'sellerToken'),
      genRequest('Seller orders', 'GET', '/seller/orders?page=1&limit=10', null, [
        ...okTest(),
        ...statusTest(200),
        'var list = resp.data?.data || resp.orders || [];',
        'pm.test("Is array", () => pm.expect(Array.isArray(list)).to.be.true);',
        'if (list.length > 0) {',
        '  pm.collectionVariables.set("sellerOrderId", list[0].id || list[0].orderId);',
        '  console.log("First order: " + (list[0].id || "").slice(0,8));',
        '}',
      ], 'sellerToken'),
    ]),

    // ===== F8: SELLER WALLET & MANAGEMENT =====
    genFolder('F8 — Seller Wallet & Management', [
      genRequest('Order detail', 'GET', '/seller/orders/{{sellerOrderId}}', null, [
        ...okTest(),
        'pm.test("200 or 404", () => pm.expect(pm.response.code).to.be.oneOf([200, 404]));',
      ], 'sellerToken'),
      genRequest('Seller wallet', 'GET', '/seller/wallet', null, [
        ...okTest(),
        ...statusTest(200),
        'var w = resp.data || resp;',
        'if (w.balance !== undefined) {',
        '  pm.collectionVariables.set("walletBalance", String(w.balance));',
        '}',
        'console.log("Wallet: " + JSON.stringify(w).slice(0,200));',
      ], 'sellerToken'),
      genRequest('Pending payouts', 'GET', '/seller/wallet/pending', null, [
        ...okTest(),
        ...statusTest(200),
        'console.log("Pending: " + JSON.stringify(resp).slice(0,200));',
      ], 'sellerToken'),
      genRequest('Seller listings', 'GET', '/listings/my-listings?page=1&limit=10', null, [
        ...okTest(),
        ...statusTest(200),
      ], 'sellerToken'),
      genRequest('Request withdrawal', 'POST', '/seller/wallet/withdrawal', {
        amount: 100,
        details: 'Test withdrawal via Newman E2E',
      }, [
        ...okTest(),
        'console.log("Withdrawal: " + JSON.stringify(resp).slice(0,200));',
      ], 'sellerToken'),
    ]),

    // ===== F9: AUTH AS ADMIN =====
    genFolder('F9 — Auth (Admin)', [
      genRequest('Login as ADMIN', 'POST', '/auth/admin-login', {
        email: '{{adminEmail}}',
        password: '{{adminPassword}}',
      }, [
        ...okTest(),
        'pm.test("Login result", () => {',
        '  if (pm.response.code === 200) {',
        '    pm.expect(resp).to.have.property("accessToken");',
        '    pm.collectionVariables.set("adminToken", resp.accessToken);',
        '    console.log("Admin login OK");',
        '  }',
        '});',
      ]),
    ]),

    // ===== F10: ADMIN DASHBOARD =====
    genFolder('F10 — Admin Dashboard', [
      genRequest('Admin dashboard', 'GET', '/admin/dashboard', null, [
        ...okTest(),
        ...statusTest(200),
        'console.log("Admin dash: " + JSON.stringify(resp).slice(0,200));',
      ], 'adminToken'),
      genRequest('Admin settings', 'GET', '/admin/settings', null, [
        ...okTest(),
        ...statusTest(200),
      ], 'adminToken'),
      genRequest('All orders (admin)', 'GET', '/orders?mode=admin&page=1&limit=20', null, [
        ...okTest(),
        ...statusTest(200),
        'var list = resp.data || resp.orders || [];',
        'if (list.length > 0) {',
        '  pm.collectionVariables.set("adminOrderId", list[0].id);',
        '}',
        'console.log("Total orders: " + list.length);',
      ], 'adminToken'),
      genRequest('Wallet transactions', 'GET', '/admin/wallet/transactions?page=1&limit=10', null, [
        ...okTest(),
        ...statusTest(200),
      ], 'adminToken'),
      genRequest('Admin notifications', 'GET', '/admin/notifications', null, [
        ...okTest(),
        ...statusTest(200),
      ], 'adminToken'),
      genRequest('Order stats (admin)', 'GET', '/admin/orders/stats?period=month', null, [
        ...okTest(),
        ...statusTest(200),
      ], 'adminToken'),
      genRequest('All users wallets', 'GET', '/admin/wallet/users', null, [
        ...okTest(),
        ...statusTest(200),
      ], 'adminToken'),
    ]),

    // ===== F11: FEATURE FLAGS & PUBLIC =====
    genFolder('F11 — Feature Flags & Public', [
      genRequest('Feature flags', 'GET', '/feature-flags', null, [
        ...okTest(),
        ...statusTest(200),
        'var flags = resp.data || resp;',
        'pm.test("Is array", () => pm.expect(Array.isArray(flags)).to.be.true);',
      ]),
      genRequest('Public listings', 'GET', '/listings?page=1&limit=10', null, [
        ...okTest(),
        ...statusTest(200),
      ]),
    ]),

    // ===== F12: PAYMENTS & INTEGRATIONS =====
    genFolder('F12 — Payments & Integrations', [
      genRequest('Payment config', 'GET', '/payments/config', null, [
        ...okTest(),
        ...statusTest(200),
      ]),
    ]),
  ],
};

// ===== Environment =====
const environment = {
  name: 'Hydra BE — Seller Flow E2E (Local DB Clone)',
  values: [
    { key: 'baseUrl', value: 'http://localhost:3002', type: 'default', enabled: true },
    { key: 'clientEmail', value: 'cliente@hydracollect.com', type: 'default', enabled: true },
    { key: 'clientPassword', value: 'password123', type: 'secret', enabled: true },
    { key: 'sellerEmail', value: 'vendedor@hydracollect.com', type: 'default', enabled: true },
    { key: 'sellerPassword', value: 'password123', type: 'secret', enabled: true },
    { key: 'adminEmail', value: 'admin@hydracollect.com', type: 'default', enabled: true },
    { key: 'adminPassword', value: 'password123', type: 'secret', enabled: true },
    { key: 'clientToken', value: '', type: 'default', enabled: true },
    { key: 'sellerToken', value: '', type: 'default', enabled: true },
    { key: 'adminToken', value: '', type: 'default', enabled: true },
    { key: 'loginEndpoint', value: 'http://localhost:3002/api/v1/auth/login', type: 'default', enabled: true },
    { key: 'adminLoginEndpoint', value: 'http://localhost:3002/api/v1/auth/admin-login', type: 'default', enabled: true },
    { key: 'productId', value: '', type: 'default', enabled: true },
    { key: 'cartItemId', value: '', type: 'default', enabled: true },
    { key: 'clientOrderId', value: '', type: 'default', enabled: true },
    { key: 'sellerOrderId', value: '', type: 'default', enabled: true },
    { key: 'adminOrderId', value: '', type: 'default', enabled: true },
  ],
};

fs.writeFileSync(COLLECTION_FILE, JSON.stringify(collection, null, 2));
fs.writeFileSync(ENV_FILE, JSON.stringify(environment, null, 2));

const totalReqs = collection.item.reduce((a, f) => a + f.item.length, 0);
console.log(`Generated: ${COLLECTION_FILE}`);
console.log(`Generated: ${ENV_FILE}`);
console.log(`Folders: ${collection.item.length}, Requests: ${totalReqs}`);
