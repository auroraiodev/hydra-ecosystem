function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  const raw = (
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3002'
  ).replace(/\/$/, '').replace('localhost', '127.0.0.1');
  if (raw.endsWith('/api/v1')) return raw;
  if (raw.endsWith('/api')) return `${raw}/v1`;
  return `${raw}/api/v1`;
}

export const API_URL = getApiBaseUrl();

function parseExpiry(val?: string, defaultSecs = 3600): number {
  if (!val) return defaultSecs;
  const match = val.trim().match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return defaultSecs;
  const n = parseInt(match[1], 10);
  switch (match[2].toLowerCase()) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 60 * 60;
    case 'd':
      return n * 24 * 60 * 60;
    default:
      return defaultSecs;
  }
}

export const AUTH_COOKIE_MAX_AGE = parseExpiry(
  process.env.JWT_EXPIRES_IN || process.env.NEXT_PUBLIC_JWT_EXPIRES_IN,
  900
);
export const REFRESH_COOKIE_MAX_AGE = parseExpiry(
  process.env.REFRESH_EXPIRES_IN || process.env.NEXT_PUBLIC_REFRESH_EXPIRES_IN,
  604800
);
