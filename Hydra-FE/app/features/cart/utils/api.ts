import { API_URL } from '@/lib/constants/api';
import { logger } from '@/lib/utils/logger';
import { CartResponseSchema } from '@/lib/validations/cart';
import { tokenStore } from '@/lib/utils/tokenStore';
import type {
  CartResponse,
  CartItemResponse,
  AddCartItemRequest,
  UpdateCartItemRequest,
  CartSummaryResponse,
} from '../types';

type CartError = Error & { status?: number; isExpected?: boolean; errorData?: unknown };

// Helper function to decode JWT token (without verification)
function decodeJWT(token: string): { exp?: number; sub?: string; [key: string]: unknown } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch {
    return null;
  }
}

// Helper function to check if token is expired
function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  const exp = decoded.exp * 1000; // Convert to milliseconds
  return Date.now() >= exp;
}

// Deduplicates concurrent refresh requests
let _refreshPromise: Promise<string | null> | null = null;

async function refreshCartToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          tokenStore.set(data.token);
          return data.token as string;
        }
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}

async function getValidToken(): Promise<string | null> {
  const token = tokenStore.get();

  if (token && !isTokenExpired(token)) return token;

  if (token && isTokenExpired(token)) {
    logger.warn('[Cart API] Token is expired, attempting refresh');
    tokenStore.clear();
    if (typeof window !== 'undefined') localStorage.removeItem('user:v1');
  }

  // Token missing or expired — try restore from session cookie first
  if (typeof window !== 'undefined') {
    try {
      const sessionRes = await fetch('/api/auth/session');
      if (sessionRes.ok) {
        const { token: sessionToken } = await sessionRes.json();
        if (sessionToken && !isTokenExpired(sessionToken)) {
          tokenStore.set(sessionToken);
          return sessionToken;
        }
      }
    } catch {
      // ignore, fall through to refresh
    }
  }

  // Last resort: try refresh token
  return refreshCartToken();
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getValidToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// Shared fetch wrapper: builds auth headers, retries once on backend 401 with a fresh token.
async function cartFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders();
  const merged = { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) } };

  let response = await fetch(url, merged);

  if (response.status === 401) {
    const newToken = await refreshCartToken();
    if (newToken) {
      const retryHeaders = { ...merged.headers, Authorization: `Bearer ${newToken}` };
      response = await fetch(url, { ...merged, headers: retryHeaders });
    }
  }

  return response;
}

function throw401(message = 'Unauthorized'): never {
  const error = new Error(message) as CartError;
  error.status = 401;
  error.isExpected = true;
  throw error;
}

function clearAuthData() {
  tokenStore.clear();
  if (typeof window !== 'undefined') localStorage.removeItem('user:v1');
}

export async function getCart(): Promise<CartResponse> {
  const response = await cartFetch(`${API_URL}/cart`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearAuthData();
      throw401(errorData.message);
    }
    throw new Error(errorData.message || 'Error al obtener el carrito');
  }

  const json = await response.json();

  const validation = CartResponseSchema.safeParse(json);
  if (!validation.success) {
    logger.error('[cart/getCart] Validation failed', {
      errors: validation.error.format(),
      data: json,
    });
  }

  return json;
}

export async function addCartItem(
  item: AddCartItemRequest
): Promise<{ success: boolean; data: CartItemResponse }> {
  const response = await cartFetch(`${API_URL}/cart/items`, {
    method: 'POST',
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    const errorData = await response.json().catch((err) => {
      logger.error('[cart/addItem] JSON parse error', { error: err });
      return {};
    });
    if (response.status === 401) {
      clearAuthData();
      throw401(errorData.message);
    }
    if (response.status === 400) {
      const error = new Error(errorData.message || 'Error al agregar item al carrito') as CartError;
      error.status = 400;
      error.errorData = errorData;
      throw error;
    }
    throw new Error(errorData.message || 'Error al agregar item al carrito');
  }

  return response.json();
}

export async function updateCartItem(
  itemId: string,
  update: UpdateCartItemRequest
): Promise<{ success: boolean; data: CartItemResponse }> {
  const response = await cartFetch(`${API_URL}/cart/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearAuthData();
      throw401(errorData.message);
    }
    throw new Error(errorData.message || 'Error al actualizar item del carrito');
  }

  return response.json();
}

export async function removeCartItem(
  itemId: string
): Promise<{ success: boolean; message: string }> {
  const response = await cartFetch(`${API_URL}/cart/items/${itemId}`, { method: 'DELETE' });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearAuthData();
      throw401(errorData.message);
    }
    throw new Error(errorData.message || 'Error al eliminar item del carrito');
  }

  return response.json();
}

export async function clearCart(): Promise<{ success: boolean; message: string }> {
  const response = await cartFetch(`${API_URL}/cart`, { method: 'DELETE' });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearAuthData();
      throw401(errorData.message);
    }
    throw new Error(errorData.message || 'Error al limpiar el carrito');
  }

  return response.json();
}

export async function mergeGuestCart(
  items: AddCartItemRequest[]
): Promise<{ success: boolean; data: CartItemResponse[] }> {
  const token = await getValidToken();
  if (!token) throw401('User not authenticated');

  const response = await cartFetch(`${API_URL}/cart/merge`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearAuthData();
      throw401(errorData.message);
    }
    throw new Error(errorData.message || 'Error merging guest cart');
  }

  return response.json();
}

export async function getCartSummary(
  shippingMethod?: string,
  itemIds?: string[]
): Promise<CartSummaryResponse> {
  const query = new URLSearchParams();
  if (shippingMethod) query.set('shippingMethod', shippingMethod);
  if (itemIds && itemIds.length > 0) query.set('itemIds', itemIds.join(','));
  const url = query.toString() ? `${API_URL}/cart/summary?${query}` : `${API_URL}/cart/summary`;

  const response = await cartFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch((err) => {
      logger.error('[cart/getCartSummary] JSON parse error', { error: err });
      return {};
    });
    if (response.status === 401) {
      clearAuthData();
      throw401(errorData.message);
    }
    throw new Error(errorData.message || 'Error al obtener el resumen del carrito');
  }

  return response.json();
}
