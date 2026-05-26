import { cookies } from 'next/headers';
import { decryptCookie, COOKIE_NAME } from '@/lib/cookie-crypto';

const getBackendBaseUrl = () => {
  const base =
    process.env.API_URL_INTERNAL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3002/api';

  const normalized = base.replace(/\/+$/, '');
  const withApi = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  return `${withApi}/v1`;
};

const BACKEND_BASE_URL = getBackendBaseUrl();

async function serverApiCall(endpoint: string, options: RequestInit = {}) {
  const cookieStore = cookies();
  const raw = (await cookieStore).get(COOKIE_NAME)?.value;
  const token = raw ? decryptCookie(raw) : null;

  if (!token && process.env.NODE_ENV === 'development') {
    console.warn(
      `[server-api] No valid ${COOKIE_NAME} cookie for ${endpoint} — request will be unauthenticated`
    );
  }

  const url = `${BACKEND_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    // Never cache dashboard data — always fetch fresh
    cache: 'no-store',
  });

  if (!response.ok) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[server-api] ${response.status} ${response.statusText} — ${url}`);
    }
    throw new Error(`Server API Error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  // ResponseInterceptor wraps every response: { success, data, meta }
  // Unwrap so callers receive the payload directly
  return json?.data !== undefined ? json.data : json;
}

// serverAdminAPI is admin-only, not used in seller dashboard

export const serverSellerAPI = {
  getDashboardStats: () => serverApiCall('/seller/dashboard'),
  getOrderStats: () => serverApiCall('/seller/orders/stats'),
  getRevenueAnalytics: (days = 30) => serverApiCall(`/seller/analytics/revenue?days=${days}`),
};
