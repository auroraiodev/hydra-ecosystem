/**
 * Centralized API configuration and URL calculation.
 * Ensures /v1 suffix is handled correctly and consistently across the app.
 */

const getBackendBaseUrl = () => {
  const base =
    process.env.API_URL_INTERNAL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' ? 'http://hydra-admin-api:3002/api' : 'http://127.0.0.1:3002/api');

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

  const normalized = base.trim().replace(/\/+$/, '');

  if (normalized.endsWith('/api/v1')) return normalized;
  if (normalized.endsWith('/api')) return `${normalized}/v1`;
  return `${normalized}/api/v1`;
};

export const BACKEND_BASE_URL = getBackendBaseUrl();
export const BACKEND_ROOT_URL = getBackendRootUrl();
export const AUTH_SERVICE_URL = getAuthServiceUrl();
