import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server } from 'socket.io';
import { parse as parseUrl } from 'url';

// ── FAKE AUTHENTICATION TOKEN GENERATOR ──────────────────────────────────────────
function createFakeToken(email = 'admin@hydracollect.com') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'admin-id-123',
      email,
      role: 'ADMIN',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours in the future
    })
  ).toString('base64url');
  return `${header}.${payload}.fakesignature`;
}

// ── IN-MEMORY DATABASE STATE ──────────────────────────────────────────────────────
const tcgs = [
  { id: 'tcg-mtg', name: 'mtg', display_name: 'Magic: The Gathering', is_active: true, logo_url: '/cat.png', icon_url: '/cat.png', loader_url: null, order: 1 },
  { id: 'tcg-ygo', name: 'ygo', display_name: 'Yu-Gi-Oh!', is_active: true, logo_url: '/cat.png', icon_url: '/cat.png', loader_url: null, order: 2 },
  { id: 'tcg-pkmn', name: 'pokemon', display_name: 'Pokémon', is_active: true, logo_url: '/cat.png', icon_url: '/cat.png', loader_url: null, order: 3 },
];

const categories = [
  { id: 'cat-singles', name: 'singles', display_name: 'Singles', is_active: true, tcgId: 'tcg-mtg' },
  { id: 'cat-sealed', name: 'sealed', display_name: 'Sealed Product', is_active: true, tcgId: 'tcg-mtg' },
];

const conditions = [
  { id: 'cond-nm', name: 'Near Mint', display_name: 'NM' },
  { id: 'cond-lp', name: 'Lightly Played', display_name: 'LP' },
  { id: 'cond-mp', name: 'Moderately Played', display_name: 'MP' },
];

const languages = [
  { id: 'lang-en', name: 'English', display_name: 'EN' },
  { id: 'lang-es', name: 'Spanish', display_name: 'ES' },
];

const users = [
  { id: 'admin-id-123', name: 'Admin Principal', email: 'admin@hydracollect.com', role: 'ADMIN' },
  { id: 'user-1', name: 'Juan Perez', email: 'juan@example.com', role: 'USER' },
  { id: 'user-2', name: 'Maria Gomez', email: 'maria@example.com', role: 'SELLER' },
];

const products = [
  {
    id: 'prod-1',
    name: 'Black Lotus',
    cardSet: 'Alpha',
    cardNumber: '233',
    tcg: 'mtg',
    category: 'Singles',
    originLabel: 'Nacional',
    condition_id: 'cond-nm',
    condition: 'near-mint',
    price: 25000,
    stock: 1,
    language_id: 'lang-en',
    tags: [
      { id: 'tag-1', name: 'Commander' },
      { id: 'tag-2', name: 'Personal' }
    ],
    foil: false,
    img: '/cat.png',
    owner_id: 'admin-id-123',
  },
  {
    id: 'prod-2',
    name: 'Mox Diamond',
    cardSet: 'Stronghold',
    cardNumber: '138',
    tcg: 'mtg',
    category: 'Singles',
    originLabel: 'Nacional',
    condition_id: 'cond-nm',
    condition: 'near-mint',
    price: 12000,
    stock: 3,
    language_id: 'lang-en',
    tags: [
      { id: 'tag-1', name: 'Commander' }
    ],
    foil: true,
    img: '/cat.png',
    owner_id: 'user-2',
  },
];

const orders = [
  {
    id: 'order-1',
    order_number: 'order-1',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    total: 1250,
    user: { id: 'user-1', name: 'Juan Perez', email: 'juan@example.com' },
    items: [
      {
        id: 'item-1',
        name: 'Sol Ring',
        quantity: 1,
        price: 250,
        singleId: 'prod-1',
        productData: { name: 'Sol Ring', img: '/cat.png', cardSet: 'Commander' },
      },
    ],
    trackingNumber: null,
    carrier: null,
    estimatedDelivery: null,
  },
  {
    id: 'order-2',
    order_number: 'order-2',
    status: 'PAID',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    total: 850,
    user: { id: 'user-2', name: 'Maria Gomez', email: 'maria@example.com' },
    items: [
      {
        id: 'item-2',
        name: 'Command Tower',
        quantity: 2,
        price: 300,
        singleId: 'prod-2',
        productData: { name: 'Command Tower', img: '/cat.png', cardSet: 'Commander' },
      },
    ],
    trackingNumber: 'TRACK-123',
    carrier: 'DHL',
    estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
  },
];

const banners = [
  {
    id: 'banner-1',
    title: 'MTG Modern Horizons 3',
    desktop_image: '/cat.png',
    button_link: '/dashboard/products',
    is_active: true,
    order: 1,
    tcg_id: 'tcg-mtg',
  },
];

const transactions = [
  {
    id: 'tx-1',
    type: 'DEPOSIT',
    amount: 1250,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    user: { name: 'Juan Perez' },
  },
  {
    id: 'tx-2',
    type: 'WITHDRAWAL',
    amount: 500,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    user: { name: 'Maria Gomez' },
  },
];

const featureFlags = {
  'chat-enabled': true,
  'maintenance-mode': false,
};

const settings = {
  siteName: 'Hydra Collect',
  maintenanceMode: false,
};

const chatConversations = [
  {
    userId: 'user-1',
    userEmail: 'juan@example.com',
    userName: 'Juan Perez',
    lastMessage: 'Hola, tengo una duda con mi pedido',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 1,
  },
];

const chatMessages: Record<string, any[]> = {
  'user-1': [
    {
      id: 'msg-1',
      userId: 'user-1',
      content: 'Hola, tengo una duda con mi pedido',
      sender: 'user',
      createdAt: new Date(Date.now() - 60000).toISOString(),
    },
  ],
};

// Helper to read request body
async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

// ── HTTP API REQUEST HANDLER ──────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  const parsedUrl = parseUrl(req.url || '', true);
  const path = parsedUrl.pathname || '';
  const query = parsedUrl.query;

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Debug logging
  console.log(`[MOCK BE] ${req.method} ${path}`);

  // JSON content-type
  res.setHeader('Content-Type', 'application/json');

  try {
    // ── AUTHENTICATION ──
    if (path === '/api/v1/auth/admin-login' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req));
      if (body.email === 'admin@hydracollect.com' && body.password === 'adminpassword') {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            data: {
              user: {
                id: 'admin-id-123',
                email: 'admin@hydracollect.com',
                name: 'Admin Principal',
                role: { name: 'ADMIN' },
              },
              accessToken: createFakeToken(body.email),
              refreshToken: 'refresh-token-123',
            },
          })
        );
      } else {
        res.writeHead(400);
        res.end(JSON.stringify({ message: 'Invalid credentials' }));
      }
      return;
    }

    // ── DASHBOARD ANALTICS & STATS ──
    if (path === '/api/v1/admin/dashboard' && req.method === 'GET') {
      const totalRevenue = orders
        .filter((o) => o.status === 'PAID')
        .reduce((sum, o) => sum + o.total, 0);
      res.writeHead(200);
      res.end(
        JSON.stringify({
          totalRevenue,
          revenueToday: 850,
          totalUsers: users.length,
          newUsersToday: 1,
          activeUsers: 2,
          totalOrders: orders.length,
          ordersToday: 1,
          recentOrders: orders,
        })
      );
      return;
    }

    if (path === '/api/v1/admin/orders/stats' && req.method === 'GET') {
      const pending = orders.filter((o) => o.status === 'PENDING').length;
      const paid = orders.filter((o) => o.status === 'PAID').length;
      res.writeHead(200);
      res.end(
        JSON.stringify({
          totalOrders: orders.length,
          pendingOrders: pending,
          paidOrders: paid,
          processingOrders: 0,
          shippedOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          averageOrderValue: 1050,
        })
      );
      return;
    }

    if (path === '/api/v1/orders/stats' && req.method === 'GET') {
      const pending = orders.filter((o) => o.status === 'PENDING').length;
      const paid = orders.filter((o) => o.status === 'PAID').length;
      res.writeHead(200);
      res.end(
        JSON.stringify({
          totalOrders: orders.length,
          pendingOrders: pending,
          paidOrders: paid,
          processingOrders: 0,
          shippedOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          averageOrderValue: 1050,
        })
      );
      return;
    }

    if (path === '/api/v1/admin/analytics/revenue' && req.method === 'GET') {
      res.writeHead(200);
      res.end(
        JSON.stringify([
          { period: '2026-05', revenue: 2100, orders: 2 },
          { period: '2026-04', revenue: 1500, orders: 1 },
        ])
      );
      return;
    }

    // ── GENERAL METADATA (TCGs, Categories, etc.) ──
    if ((path === '/api/v1/tcgs' || path === '/api/v1/tcgs/active') && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(tcgs));
      return;
    }

    if (
      (path === '/api/v1/categories' || path === '/api/v1/categories/active') &&
      req.method === 'GET'
    ) {
      res.writeHead(200);
      res.end(JSON.stringify(categories));
      return;
    }

    if (
      (path === '/api/v1/conditions' || path === '/api/v1/conditions/active') &&
      req.method === 'GET'
    ) {
      res.writeHead(200);
      res.end(JSON.stringify(conditions));
      return;
    }

    if (
      (path === '/api/v1/languages' || path === '/api/v1/languages/active') &&
      req.method === 'GET'
    ) {
      res.writeHead(200);
      res.end(JSON.stringify(languages));
      return;
    }

    // ── USERS ──
    if (path === '/api/v1/users' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(users));
      return;
    }

    if (path.startsWith('/api/v1/users/') && req.method === 'PATCH') {
      const parts = path.split('/');
      const id = parts[parts.length - 1];
      const body = JSON.parse(await readBody(req));
      const userIndex = users.findIndex((u) => u.id === id);
      if (userIndex >= 0) {
        users[userIndex] = { ...users[userIndex], ...body };
        res.writeHead(200);
        res.end(JSON.stringify(users[userIndex]));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'User not found' }));
      }
      return;
    }

    // ── SINGLES (INVENTORY) ──
    if ((path === '/api/v1/singles' || path === '/api/v1/singles/local') && req.method === 'GET') {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          data: products,
          total: products.length,
          totalPages: 1,
        })
      );
      return;
    }

    if (path === '/api/v1/singles' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req));
      const newProduct = {
        id: `prod-${Date.now()}`,
        name: body.name || 'Nuevo Producto',
        cardSet: body.cardSet || 'Promo',
        cardNumber: body.cardNumber || '1',
        tcg: body.tcg || 'mtg',
        category: body.category || 'Singles',
        originLabel: 'Nacional',
        condition_id: body.condition_id || 'cond-nm',
        condition: 'near-mint',
        price: Number(body.price) || 10,
        stock: Number(body.stock) || 1,
        language_id: body.language_id || 'lang-en',
        tags: body.tags || [],
        foil: !!body.foil,
        img: body.img || '/cat.png',
        owner_id: body.owner_id || 'admin-id-123',
      };
      products.push(newProduct);
      res.writeHead(201);
      res.end(JSON.stringify(newProduct));
      return;
    }

    if (path.startsWith('/api/v1/singles/') && req.method === 'PATCH') {
      const parts = path.split('/');
      const id = parts[3]; // format is /api/v1/singles/:id or singles/:id/tags etc.
      const subAction = parts[4];
      
      const productIndex = products.findIndex((p) => p.id === id);
      if (productIndex >= 0) {
        const body = JSON.parse(await readBody(req));
        if (subAction === 'tags') {
          products[productIndex].tags = body.tags;
        } else if (subAction === 'foil') {
          products[productIndex].foil = body.foil;
        } else {
          products[productIndex] = { ...products[productIndex], ...body };
        }
        res.writeHead(200);
        res.end(JSON.stringify(products[productIndex]));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Product not found' }));
      }
      return;
    }

    if (path.startsWith('/api/v1/singles/') && req.method === 'DELETE') {
      const parts = path.split('/');
      const id = parts[parts.length - 1];
      const productIndex = products.findIndex((p) => p.id === id);
      if (productIndex >= 0) {
        products.splice(productIndex, 1);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Product not found' }));
      }
      return;
    }

    // ── ORDERS ──
    if (path === '/api/v1/orders' && req.method === 'GET') {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          data: orders,
          total: orders.length,
          totalPages: 1,
        })
      );
      return;
    }

    if (path.startsWith('/api/v1/orders/') && req.method === 'GET') {
      const parts = path.split('/');
      const id = parts[parts.length - 1];
      const order = orders.find((o) => o.id === id);
      if (order) {
        res.writeHead(200);
        res.end(JSON.stringify(order));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Order not found' }));
      }
      return;
    }

    if (path.startsWith('/api/v1/orders/') && req.method === 'PATCH') {
      const parts = path.split('/');
      const id = parts[parts.length - 1];
      const orderIndex = orders.findIndex((o) => o.id === id);
      if (orderIndex >= 0) {
        const body = JSON.parse(await readBody(req));
        orders[orderIndex] = { ...orders[orderIndex], ...body };
        res.writeHead(200);
        res.end(JSON.stringify(orders[orderIndex]));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Order not found' }));
      }
      return;
    }

    if (path.startsWith('/api/v1/orders/') && path.endsWith('/tracking') && req.method === 'POST') {
      const parts = path.split('/');
      const id = parts[parts.length - 2];
      const orderIndex = orders.findIndex((o) => o.id === id);
      if (orderIndex >= 0) {
        const body = JSON.parse(await readBody(req));
        orders[orderIndex].trackingNumber = body.trackingNumber;
        orders[orderIndex].carrier = body.carrier || 'DHL';
        orders[orderIndex].estimatedDelivery = body.estimatedDelivery || new Date().toISOString();
        res.writeHead(200);
        res.end(JSON.stringify(orders[orderIndex]));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Order not found' }));
      }
      return;
    }

    if (path.startsWith('/api/v1/orders/') && path.endsWith('/cancel') && req.method === 'POST') {
      const parts = path.split('/');
      const id = parts[parts.length - 2];
      const orderIndex = orders.findIndex((o) => o.id === id);
      if (orderIndex >= 0) {
        orders[orderIndex].status = 'CANCELLED';
        res.writeHead(200);
        res.end(JSON.stringify(orders[orderIndex]));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Order not found' }));
      }
      return;
    }

    if (path.startsWith('/api/v1/orders/') && path.endsWith('/mark-paid-local') && req.method === 'POST') {
      const parts = path.split('/');
      const id = parts[parts.length - 2];
      const orderIndex = orders.findIndex((o) => o.id === id);
      if (orderIndex >= 0) {
        orders[orderIndex].status = 'PAID';
        res.writeHead(200);
        res.end(JSON.stringify(orders[orderIndex]));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Order not found' }));
      }
      return;
    }

    // ── BANNERS ──
    if (path === '/api/v1/banners' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(banners));
      return;
    }

    if (path === '/api/v1/banners' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req));
      const newBanner = {
        id: `banner-${Date.now()}`,
        title: body.title || 'Nuevo Banner',
        desktop_image: body.desktop_image || '/cat.png',
        button_link: body.button_link || '/dashboard',
        is_active: body.is_active !== false,
        order: Number(body.order) || 1,
        tcg_id: body.tcg_id || null,
      };
      banners.push(newBanner);
      res.writeHead(201);
      res.end(JSON.stringify(newBanner));
      return;
    }

    if (path.startsWith('/api/v1/banners/') && req.method === 'PATCH') {
      const parts = path.split('/');
      const id = parts[parts.length - 1];
      const bannerIndex = banners.findIndex((b) => b.id === id);
      if (bannerIndex >= 0) {
        const body = JSON.parse(await readBody(req));
        banners[bannerIndex] = { ...banners[bannerIndex], ...body };
        res.writeHead(200);
        res.end(JSON.stringify(banners[bannerIndex]));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Banner not found' }));
      }
      return;
    }

    if (path.startsWith('/api/v1/banners/') && req.method === 'DELETE') {
      const parts = path.split('/');
      const id = parts[parts.length - 1];
      const bannerIndex = banners.findIndex((b) => b.id === id);
      if (bannerIndex >= 0) {
        banners.splice(bannerIndex, 1);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Banner not found' }));
      }
      return;
    }

    // ── WALLET / TRANSACTIONS ──
    if (path === '/api/v1/admin/wallet/transactions' && req.method === 'GET') {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          data: transactions,
          total: transactions.length,
          totalPages: 1,
        })
      );
      return;
    }

    // ── FEATURE FLAGS ──
    if (path === '/api/v1/feature-flags' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(featureFlags));
      return;
    }

    if (path.startsWith('/api/v1/feature-flags/') && req.method === 'PATCH') {
      const parts = path.split('/');
      const key = parts[parts.length - 1] as keyof typeof featureFlags;
      const body = JSON.parse(await readBody(req));
      if (key in featureFlags) {
        (featureFlags as any)[key] = body.enabled;
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Feature flag not found' }));
      }
      return;
    }

    // ── SYSTEM SETTINGS ──
    if (path === '/api/v1/admin/settings' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(settings));
      return;
    }

    if (path === '/api/v1/admin/settings' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req));
      Object.assign(settings, body);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // ── MAINTENANCE TRIGGERS ──
    if (path.startsWith('/api/v1/admin/maintenance/') && req.method === 'POST') {
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, message: 'Operación ejecutada con éxito' }));
      return;
    }

    // ── NOTIFICATIONS ──
    if (path === '/api/v1/notifications' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({ data: [] }));
      return;
    }

    // ── CHAT HISTORY & CONVERSATIONS ──
    if (path === '/api/v1/chat/conversations' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({ data: chatConversations }));
      return;
    }

    if (path === '/api/v1/chat/history/user' && req.method === 'GET') {
      const userId = String(query.userId || '');
      const messages = chatMessages[userId] || [];
      const mappedMessages = messages.map(m => ({
        id: m.id,
        user_id: m.userId || m.user_id,
        content: m.content,
        sender: m.sender,
        created_at: m.createdAt || m.created_at,
      }));
      res.writeHead(200);
      res.end(JSON.stringify({ data: mappedMessages }));
      return;
    }

    if (path.startsWith('/api/v1/chat/conversation/') && req.method === 'DELETE') {
      const parts = path.split('/');
      const userId = parts[parts.length - 1];
      const idx = chatConversations.findIndex((c) => c.userId === userId);
      if (idx >= 0) {
        chatConversations.splice(idx, 1);
        delete chatMessages[userId];
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Conversation not found' }));
      }
      return;
    }

    // HEALTH CHECK
    if (path === '/api/health' || path === '/api/v1/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    // FALLBACK
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not mocked' }));
  } catch (error: any) {
    console.error('[MOCK BE ERROR]', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Mock Server Error', details: error.message }));
  }
});

// ── SOCKET.IO CHAT SERVER MOCK ────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],
});

const chatNamespace = io.of('/chat');

chatNamespace.on('connection', (socket) => {
  console.log('[MOCK SOCKET] Client connected to /chat');

  // Trigger simulated online event when client connects
  socket.emit('user_online', {
    userId: 'user-1',
    userName: 'Juan Perez',
    userEmail: 'juan@example.com',
  });

  socket.on('mark_read', (data) => {
    console.log('[MOCK SOCKET] mark_read received:', data);
    const convo = chatConversations.find((c) => c.userId === data.userId);
    if (convo) convo.unreadCount = 0;
  });

  socket.on('admin_reply', (data) => {
    console.log('[MOCK SOCKET] admin_reply received:', data);
    const { userId, content } = data;
    
    // Save to message log
    if (!chatMessages[userId]) chatMessages[userId] = [];
    
    const replyMsg = {
      id: `msg-${Date.now()}`,
      userId,
      content,
      sender: 'admin',
      createdAt: new Date().toISOString(),
    };
    chatMessages[userId].push(replyMsg);
    
    // Broadcast back to echo it in UI
    socket.emit('message_sent', replyMsg);

    // Simulate automatic client response in 1 second
    setTimeout(() => {
      const echoMsg = {
        id: `msg-${Date.now() + 1}`,
        userId,
        content: `Recibido: "${content}". ¡Gracias por contestar!`,
        sender: 'user',
        createdAt: new Date().toISOString(),
      };
      chatMessages[userId].push(echoMsg);

      // Update last message in convo list
      const convo = chatConversations.find((c) => c.userId === userId);
      if (convo) {
        convo.lastMessage = echoMsg.content;
        convo.lastMessageAt = echoMsg.createdAt;
        convo.unreadCount += 1;
      }
      
      socket.emit('new_user_message', echoMsg);
    }, 1000);
  });

  socket.on('disconnect', () => {
    console.log('[MOCK SOCKET] Client disconnected');
  });
});

const PORT = 3002;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[MOCK BE] Server running at http://127.0.0.1:${PORT}`);
});
