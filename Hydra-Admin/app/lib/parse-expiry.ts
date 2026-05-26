/**
 * Converts a JWT_EXPIRES_IN-style string to seconds.
 * Supports: s (seconds), m (minutes), h (hours), d (days).
 * Falls back to 3600 (1 hour) for missing or unrecognized values.
 */
function parseExpiryToSeconds(value: string | undefined): number {
  if (!value) return 3600;
  const match = value.trim().match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return 3600;
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
      return 3600;
  }
}

export const COOKIE_MAX_AGE = parseExpiryToSeconds(
  process.env.JWT_EXPIRES_IN || process.env.NEXT_PUBLIC_JWT_EXPIRES_IN || '15m'
);
export const REFRESH_COOKIE_MAX_AGE = parseExpiryToSeconds(
  process.env.REFRESH_EXPIRES_IN || process.env.NEXT_PUBLIC_REFRESH_EXPIRES_IN || '7d'
);
