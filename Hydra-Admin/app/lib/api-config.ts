/**
 * Centralized API configuration and URL calculation.
 * Ensures /v1 suffix is handled correctly and consistently across the app.
 */

const getBackendBaseUrl = () => {
  const isServer = typeof window === 'undefined';

  const base =
    // 1. Internal URL (Docker — same container or docker-compose network)
    process.env.API_URL_INTERNAL ||
    process.env.INTERNAL_API_URL ||
    // 2. Public URL (baked at build-time via NEXT_PUBLIC_*)
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    // 3. Server-side default: NestJS is co-located in the same container on :3002
    (isServer ? 'http://127.0.0.1:3002/api' :
     // 4. Client-side fallback (unlikely — all API calls go through /api/proxy)
     process.env.NODE_ENV === 'production' ? '/api' : 'http://127.0.0.1:3002/api');

  const normalized = base.trim().replace(/\/+$/, '').replace('localhost', '127.0.0.1');

  // If it already ends with /api/v1, just return it
  if (normalized.endsWith('/api/v1')) {
    return normalized;
  }

  // Ensure it has /api
  const withApi = normalized.endsWith('/api') ? normalized : `${normalized}/api`;

  // Always ensure it has /v1
  return `${withApi}/v1`;
};

const getBackendRootUrl = () => {
  const base =
    process.env.API_URL_INTERNAL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' ? 'http://hydra-admin-api:3002/api' : 'http://127.0.0.1:3002/api');

  return base.trim().replace(/\/+$/, '').replace('localhost', '127.0.0.1')
    .replace(/\/api\/v1$/, '')
    .replace(/\/api$/, '');
};

const getAuthServiceUrl = () => {
  const base =
    process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://127.0.0.1:3002';

  return base.trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '').replace(/\/api$/, '');
};

export const BACKEND_BASE_URL = getBackendBaseUrl();
export const BACKEND_ROOT_URL = getBackendRootUrl();
export const AUTH_SERVICE_URL = getAuthServiceUrl();
