// In the browser, route all data API calls through the Next.js proxy at /api/proxy.
// The proxy reads the httpOnly `access_token` cookie server-side and adds the
// Authorization: Bearer header before forwarding to the Express backend.
// This keeps the JWT out of JavaScript-accessible storage entirely.
const API_BASE_URL =
  typeof window !== 'undefined'
    ? '/api/proxy'
    : (() => {
        const base =
          process.env.API_URL_INTERNAL ||
          process.env.NEXT_PUBLIC_BACKEND_API_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          'http://localhost:3002/api';
        const normalized = base.replace(/\/+$/, '');
        const withApi = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
        return `${withApi}/v1`;
      })();

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface ApiError extends Error {
  status?: number;
  statusText?: string;
  isNetworkError?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

async function apiCall(endpoint: string, options: RequestOptions = {}) {
  // JWT is in an httpOnly cookie read by the /api/proxy server-side route.
  // No Authorization header injection needed here — the proxy handles it.
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // needed so the browser sends the httpOnly cookie to /api/proxy
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // Handle network errors (CORS, connection refused, DNS issues, etc.)
    const errorMessage = error?.message || String(error);

    // Provide better diagnostics for "Failed to fetch" (common browser error)
    if (errorMessage.toLowerCase().includes('fetch')) {
      const detailedMessage = `Network error calling ${url}: ${errorMessage}. Possible causes: Backend is down, DNS failure, or CORS/CSP block. Check browser console for more details.`;
      console.error(detailedMessage, { url, error });
      const networkError = new Error(detailedMessage) as ApiError;
      networkError.status = 0;
      networkError.statusText = 'Network Error';
      networkError.isNetworkError = true;
      throw networkError;
    }
    // Re-throw other errors
    throw error;
  }

  // Clone response to read body without consuming it
  let responseClone = response.clone();

  if (!response.ok) {
    if (response.status === 401) {
      if (!endpoint.startsWith('/auth/')) {
        if (!refreshPromise) {
          refreshPromise = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
            .then((res) => res.ok)
            .catch(() => false)
            .finally(() => {
              refreshPromise = null;
            });
        }

        const success = await refreshPromise;
        if (success) {
          // Retry the request with the new automatically set cookie
          response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
          responseClone = response.clone();

          // If retry succeeded, resume normally
          if (response.ok) {
            // For 204 No Content, return empty object or null
            if (response.status === 204) {
              return {};
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              return response.json();
            }

            const text = await response.text();
            return text ? JSON.parse(text) : {};
          }
        }
      }

      // If we fall through here, refresh failed or it was an auth endpoint
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Try to extract error message from response
    let errorMessage = response.statusText;
    try {
      const text = await responseClone.text();
      if (text) {
        try {
          const errorData = JSON.parse(text);
          // Backend returns { success: false, error: "message" }
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            // Handle validation errors array (from ValidationPipe)
            if (Array.isArray(errorData.message)) {
              errorMessage = errorData.message.join(', ');
            } else {
              errorMessage = errorData.message;
            }
          } else if (Object.keys(errorData).length > 0) {
            // Only log if there's actual data
            console.error('API Error Response:', errorData);
          }
        } catch {
          // If it's not JSON, use the text as error message
          errorMessage = text || response.statusText;
        }
      }
    } catch (parseError) {
      // If parsing fails, use statusText
      // Only log if it's a real parsing error, not just empty response
      if (parseError instanceof Error && parseError.message) {
        console.error('Failed to parse error response:', parseError);
      }
    }

    const error = new Error(errorMessage) as ApiError;
    error.status = response.status;
    error.statusText = response.statusText;
    throw error;
  }

  // For 204 No Content, return empty object or null
  if (response.status === 204) {
    return {};
  }

  // Check content-type before parsing
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  // Fallback for non-JSON responses (or empty bodies without 204)
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

// Auth endpoints (not currently used in seller dashboard)

// Users endpoints
// GET /api/users - Get all users (ADMIN, SELLER only) - No parameters
export const usersAPI = {
  // Get all users - matches backend GET /api/users endpoint (no parameters)
  list: (search?: string, hasInventory?: boolean) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (hasInventory) params.append('hasInventory', 'true');
    const qs = params.toString();
    return apiCall(`/users${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => apiCall(`/users/${id}`),
  create: (data: unknown) => apiCall('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: unknown) =>
    apiCall(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/users/${id}`, { method: 'DELETE' }),
};

// Singles endpoints (renamed from products)
// These match exactly the endpoints in hydra-be/src/products/products.controller.ts
export const singlesAPI = {
  // GET /singles - Get all products with pagination
  // Only accepts page and limit query parameters (matches backend)
  list: (
    page = 1,
    limit = 20,
    search?: string,
    category?: string,
    inStock?: boolean,
    ownerId?: string,
    tcgId?: string
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (tcgId) params.append('tcgId', tcgId);
    if (inStock) params.append('inStock', 'true');
    if (ownerId) params.append('ownerId', ownerId);
    return apiCall(`/singles?${params.toString()}`);
  },
  // GET /singles/importation/search - Search Importation
  importationSearch: (
    query: string,
    page = 1,
    filters?: {
      language?: string;
      condition?: string;
      foil?: boolean;
      sort?: string;
      includeOutOfStock?: boolean;
    }
  ) => {
    const params = new URLSearchParams({ query, page: String(page) });
    if (filters?.language) params.set('language', filters.language);
    if (filters?.condition) params.set('condition', filters.condition);
    if (filters?.foil) params.set('foil', 'true');
    if (filters?.sort) params.set('sort', filters.sort);
    if (filters?.includeOutOfStock) params.set('includeOutOfStock', 'true');
    return apiCall(`/singles/importation/search?${params.toString()}`);
  },
  // GET /singles/importation/:importationId - Find product by Importation product ID
  getByImportationId: (importationId: string) => apiCall(`/singles/importation/${importationId}`),
  // GET /singles/owner/:ownerId - Get all products owned by a specific user
  getByOwner: (ownerId: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return apiCall(`/singles/owner/${ownerId}?${params.toString()}`);
  },
  // PATCH /singles/:id/tags - Update product tags
  updateTags: (id: string, tags: string[]) =>
    apiCall(`/singles/${id}/tags`, {
      method: 'PATCH',
      body: JSON.stringify({ tags }),
    }),
  // PATCH /singles/:id/foil - Update product foil status
  updateFoil: (id: string, foil: boolean) =>
    apiCall(`/singles/${id}/foil`, {
      method: 'PATCH',
      body: JSON.stringify({ foil }),
    }),
  // GET /singles/local - Get all local inventory singles
  getLocal: (page = 1, limit = 12) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return apiCall(`/singles/local?${params.toString()}`);
  },
  getById: (id: string) => apiCall(`/singles/${id}`),
  create: (data: unknown) => apiCall('/singles', { method: 'POST', body: JSON.stringify(data) }),
  createBundle: (data: unknown) =>
    apiCall('/singles/bundle', { method: 'POST', body: JSON.stringify(data) }),
  createBulk: (products: unknown[]) =>
    apiCall('/singles/bulk', {
      method: 'POST',
      body: JSON.stringify({ products }),
    }),
  update: (id: string, data: unknown) =>
    apiCall(`/singles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  changeOwner: (id: string, owner_id: string) =>
    apiCall(`/singles/${id}/owner`, {
      method: 'PATCH',
      body: JSON.stringify({ owner_id }),
    }),
  delete: (id: string) => apiCall(`/singles/${id}`, { method: 'DELETE' }),
  deleteBulk: (ids: string[]) =>
    apiCall('/singles/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};

// Products endpoints (kept for backward compatibility, redirects to singles)

// Orders endpoints
export const ordersAPI = {
  list: (
    page = 1,
    limit = 10,
    filters?: { category?: string; search?: string; status?: string }
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      mode: 'admin',
    });
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);

    return apiCall(`/orders?${params.toString()}`);
  },
  get: (id: string) => apiCall(`/orders/${id}`),
  create: (data: unknown) => apiCall('/orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: unknown) =>
    apiCall(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/orders/${id}`, { method: 'DELETE' }),
  // Delete multiple orders
  deleteBulk: (ids: string[]) =>
    apiCall('/orders/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  // Create order as admin
  createAsAdmin: (data: unknown) =>
    apiCall('/orders/admin', { method: 'POST', body: JSON.stringify(data) }),
  // Assign order to admin/staff member
  assign: (id: string, assignData: { adminId: string; notes?: string }) =>
    apiCall(`/orders/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(assignData),
    }),
  // Link item to product (admin only)
  linkItem: (orderId: string, itemId: string, productId: string) =>
    apiCall(`/orders/${orderId}/items/${itemId}/link`, {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),
  // Remove items from order
  removeItems: (id: string, itemIds: string[]) =>
    apiCall(`/orders/${id}/items/remove`, {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    }),
  // Get payment balance after order modification
  getPaymentBalance: (id: string) => apiCall(`/orders/${id}/payment-balance`),
  // Reopen a paid order for supplemental MP payment
  reopenForPayment: (id: string) => apiCall(`/orders/${id}/reopen-for-payment`, { method: 'POST' }),
  // Update item delivery status
  updateItemDeliveryStatus: (
    orderId: string,
    itemId: string,
    payload: { isDelivered?: boolean; deliveredQuantity?: number; status?: string }
  ) =>
    apiCall(`/orders/${orderId}/items/${itemId}/delivery-status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  // Update order status
  updateStatus: (
    id: string,
    status: string,
    trackingInfo?: { trackingNumber?: string; carrier?: string; estimatedDelivery?: string }
  ) =>
    apiCall(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...trackingInfo,
      }),
    }),
  // Add tracking information
  addTracking: (
    id: string,
    trackingData: { trackingNumber: string; carrier?: string; estimatedDelivery?: string }
  ) =>
    apiCall(`/orders/${id}/tracking`, {
      method: 'POST',
      body: JSON.stringify(trackingData),
    }),
  // Add item to order
  addItem: (
    id: string,
    itemData: {
      singleId: string;
      quantity: number;
      isImportation?: boolean;
      cardName?: string;
      productData?: unknown;
    }
  ) =>
    apiCall(`/orders/${id}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),
  // Undo order and move items back to cart (Admin only)
  undoToCart: (orderId: string) =>
    apiCall(`/orders/admin/${orderId}/undo-to-cart`, { method: 'POST' }),
  // Cancel order
  cancel: (
    id: string,
    cancelData: { reason?: string; refundAmount?: number; notifyCustomer?: boolean }
  ) =>
    apiCall(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(cancelData),
    }),
  // Bulk update orders
  bulkUpdate: (
    orderIds: string[],
    updateData: { status?: string; assignedTo?: string; notes?: string }
  ) =>
    apiCall(`/orders/bulk-update`, {
      method: 'PATCH',
      body: JSON.stringify({
        orderIds,
        ...updateData,
      }),
    }),
  // Export orders
  export: (format: 'csv' | 'pdf', filters?: Record<string, string>) =>
    apiCall(
      `/orders/export?format=${format}&${filters ? new URLSearchParams(filters).toString() : ''}`,
      {
        method: 'GET',
      }
    ),
  // Get order statistics
  getStats: (period?: string, dateFrom?: string, dateTo?: string) =>
    apiCall(
      `/orders/stats?${period ? `period=${period}&` : ''}${dateFrom ? `dateFrom=${dateFrom}&` : ''}${dateTo ? `dateTo=${dateTo}` : ''}`
    ),
  // Discount all items in an order
  discountAllItems: (orderId: string) =>
    apiCall(`/orders/${orderId}/items/discount-all`, { method: 'PATCH' }),
  // Get sales history
  getSales: (page = 1, limit = 50) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return apiCall(`/orders/sales?${params.toString()}`);
  },
  // Request a review for an order
  requestReview: (id: string) => apiCall(`/orders/${id}/request-review`, { method: 'PATCH' }),
  // Mark an order as paid locally and zero out import fee (Admin only)
  markPaidLocal: (id: string) => apiCall(`/orders/${id}/mark-paid-local`, { method: 'POST' }),
};

// Reviews endpoints (not currently used in seller dashboard)

// Categories endpoints
export const categoriesAPI = {
  getAll: () => apiCall('/categories'),
  getActive: (tcgId?: string) => apiCall(`/categories/active${tcgId ? `?tcgId=${tcgId}` : ''}`),
  get: (id: string) => apiCall(`/categories/${id}`),
  create: (data: unknown) => apiCall('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: unknown) =>
    apiCall(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleActive: (id: string) => apiCall(`/categories/${id}/toggle`, { method: 'PATCH' }),
  delete: (id: string) => apiCall(`/categories/${id}`, { method: 'DELETE' }),
  list: () => apiCall('/categories'), // Alias for consistency
};

// Autocomplete endpoints (not currently used in seller dashboard)

// Card Search endpoints (Catalog/Reference)
export const cardSearchAPI = {
  search: (
    query: string,
    page = 1,
    limit = 10,
    filters?: {
      language?: string;
      condition?: string;
      foil?: boolean;
      sort?: string;
      includeOutOfStock?: boolean;
    }
  ) => {
    const params = new URLSearchParams({ query, page: String(page), limit: String(limit) });
    if (filters?.language) params.set('language', filters.language);
    if (filters?.condition) params.set('condition', filters.condition);
    if (filters?.foil) params.set('foil', 'true');
    if (filters?.sort) params.set('sort', filters.sort);
    if (filters?.includeOutOfStock) params.set('includeOutOfStock', 'true');
    return apiCall(`/singles/importation/search?${params.toString()}`);
  },
};

// Conditions endpoints
export const conditionsAPI = {
  getAll: () => apiCall('/conditions'),
  getActive: () => apiCall('/conditions/active'),
  list: () => apiCall('/conditions'),
};

// Languages endpoints
export const languagesAPI = {
  getAll: () => apiCall('/languages'),
  getActive: () => apiCall('/languages/active'),
  list: () => apiCall('/languages'),
};

// Rarities endpoints
export const raritiesAPI = {
  getAll: () => apiCall('/rarities'),
  getActive: () => apiCall('/rarities/active'),
  list: () => apiCall('/rarities'),
};

// Tags endpoints
export const tagsAPI = {
  getAll: () => apiCall('/tags'),
  getActive: () => apiCall('/tags/active'),
  getDefault: () => apiCall('/tags/default'),
  list: () => apiCall('/tags'),
  create: (data: unknown) => apiCall('/tags', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: unknown) =>
    apiCall(`/tags/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/tags/${id}`, { method: 'DELETE' }),
};

// Roles endpoints (if backend supports it, otherwise mock or use constants)
export const rolesAPI = {
  getAll: () => apiCall('/roles'),
  list: () => apiCall('/roles'),
};

export const searchAPI = {
  // GET /search/autocomplete - Get card name suggestions from Scryfall
  autocomplete: (query: string) => {
    const params = new URLSearchParams({ query });
    return apiCall(`/search/autocomplete?${params.toString()}`);
  },
};

// Admin Cart endpoints
export const adminCartAPI = {
  getCart: (userId: string) => apiCall(`/cart/admin/${userId}`),
  getSummary: (userId: string, shippingMethod?: string, paymentMethod?: string) => {
    const params = new URLSearchParams();
    if (shippingMethod) params.append('shippingMethod', shippingMethod);
    if (paymentMethod) params.append('paymentMethod', paymentMethod);
    const qs = params.toString();
    return apiCall(`/cart/admin/${userId}/summary${qs ? `?${qs}` : ''}`);
  },
  addItem: (
    userId: string,
    data: {
      singleId?: string;
      quantity: number;
      isImportation?: boolean;
      importationId?: string;
      productData?: unknown;
    }
  ) => apiCall(`/cart/admin/${userId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (userId: string, itemId: string, data: { quantity: number }) =>
    apiCall(`/cart/admin/${userId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeItem: (userId: string, itemId: string) =>
    apiCall(`/cart/admin/${userId}/items/${itemId}`, { method: 'DELETE' }),
  clearCart: (userId: string) => apiCall(`/cart/admin/${userId}`, { method: 'DELETE' }),
  // Convert user's cart to an order (Admin only)
  checkoutForUser: (userId: string, shippingMethod: string, paymentMethod: string) =>
    apiCall(`/orders/admin/checkout-for-user/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ shippingMethod, paymentMethod }),
    }),
};

// Admin analytics endpoints
export const adminAPI = {
  getDashboardStats: () => apiCall('/admin/dashboard'),
  getUserAnalytics: (days = 30) => apiCall(`/admin/analytics/users?days=${days}`),
  getOrderAnalytics: (days = 30) => apiCall(`/admin/analytics/orders?days=${days}`),
  getRevenueAnalytics: (days = 30) => apiCall(`/admin/analytics/revenue?days=${days}`),
  getProductAnalytics: (top = 10, lowStock = 5, year?: number, month?: number) => {
    const params = new URLSearchParams({ top: String(top), lowStock: String(lowStock) });
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    return apiCall(`/admin/analytics/products?${params}`);
  },
  getBuyerAnalytics: (year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    const qs = params.toString();
    return apiCall(`/admin/analytics/buyers${qs ? `?${qs}` : ''}`);
  },
  getOrderStats: (period?: string) =>
    apiCall(`/admin/orders/stats${period ? `?period=${period}` : ''}`),
};

export const sellerAPI = {
  getDashboardStats: () => apiCall('/seller/dashboard'),
  getRevenueAnalytics: (days = 30) => apiCall(`/seller/analytics/revenue?days=${days}`),
  getOrderStats: (days = 30) => apiCall(`/seller/orders/stats?days=${days}`),
  getOrders: (page = 1, limit = 10, filters?: { status?: string; search?: string; sortBy?: string; sortDir?: string }) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortDir) params.append('sortDir', filters.sortDir);
    return apiCall(`/seller/orders?${params.toString()}`);
  },
  getOrder: (id: string) => apiCall(`/seller/orders/${id}`),
  getWallet: () => apiCall('/seller/wallet'),
  getPendingPayouts: () => apiCall('/seller/wallet/pending'),
  requestWithdrawal: (amount: number, details: string) =>
    apiCall('/seller/wallet/withdrawal', {
      method: 'POST',
      body: JSON.stringify({ amount, details }),
    }),
  requestPayout: (orderIds: string[], details: string) =>
    apiCall('/seller/wallet/request-payout', {
      method: 'POST',
      body: JSON.stringify({ orderIds, details }),
    }),
};

// Notifications endpoints
export const notificationsAPI = {
  list: (limit = 20) => apiCall(`/notifications?limit=${limit}`),
  markAsRead: (id: string) => apiCall(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => apiCall('/notifications/read-all', { method: 'PATCH' }),
  broadcast: (payload: { userId?: string; title: string; message: string }) =>
    apiCall('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// TCGs endpoints
export const tcgsAPI = {
  list: () => apiCall('/tcgs'),
  active: () => apiCall('/tcgs/active'),
  get: (id: string) => apiCall(`/tcgs/${id}`),
  create: (data: {
    name: string;
    display_name: string;
    is_active?: boolean;
    logo_url?: string | null;
    icon_url?: string | null;
    order?: number;
  }) => apiCall('/tcgs', { method: 'POST', body: JSON.stringify(data) }),
  update: (
    id: string,
    data: {
      is_active?: boolean;
      display_name?: string;
      name?: string;
      logo_url?: string | null;
      icon_url?: string | null;
      order?: number;
    }
  ) => apiCall(`/tcgs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/tcgs/${id}`, { method: 'DELETE' }),
};

// settingsAPI not currently used in seller dashboard

export const featureFlagsAPI = {
  getAll: () => apiCall('/feature-flags'),
  set: (key: string, enabled: boolean) =>
    apiCall(`/feature-flags/${key}`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
};
