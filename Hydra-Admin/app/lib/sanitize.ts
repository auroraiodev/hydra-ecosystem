/**
 * Shared sanitization utilities used across the admin app.
 * React JSX already escapes HTML by default — these helpers cover
 * the remaining attack surfaces: URL attributes, URL params, and
 * allowlist-controlled string fields.
 */

/** Allowed OAuth provider identifiers → display names. */
const PROVIDER_NAMES: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  azure: 'Microsoft',
  apple: 'Apple',
};

/** Returns a safe display name for an OAuth provider from a URL param. */
export function safeProviderName(raw: string | null | undefined): string {
  if (!raw) return 'OAuth';
  const key = raw.toLowerCase().trim();
  return PROVIDER_NAMES[key] ?? 'OAuth';
}

/**
 * Sanitizes an error string coming from a URL query parameter.
 * Strips angle brackets (HTML injection), limits length, and falls back
 * to a generic message if the input looks suspicious.
 */
export function sanitizeUrlError(raw: string | null | undefined): string {
  if (!raw) return '';
  try {
    const decoded = decodeURIComponent(raw);
    // Strip anything that looks like HTML / script
    const clean = decoded
      .replace(/[<>"'`]/g, '')
      .trim()
      .slice(0, 200);
    return clean;
  } catch {
    return 'An error occurred. Please try again.';
  }
}

/**
 * Validates that a URL is safe to use as an <img src>.
 * Allows only https: origins from a known allowlist.
 * Blocks data: URIs, javascript:, blob:, and unknown origins.
 */
const ALLOWED_IMAGE_HOSTS = [
  /^cards\.scryfall\.io$/,
  /^[a-z0-9-]+\.scryfall\.io$/,
  /^[a-z0-9-]+\.scryfall\.com$/,
  /^lh3\.googleusercontent\.com$/,
  /^[a-z0-9-]+\.googleusercontent\.com$/,
  /^[a-z0-9-]+\.supabase\.co$/,
  /^[a-z0-9-]+\.importationmtg\.com$/,
  /^m\.media-amazon\.com$/,
  /^images\.unsplash\.com$/,
  /^[a-z0-9-.]+\.sslip\.io$/,
  /^files\.hareruyamtg\.com$/,
  /^localhost$/,
  /^127\.0\.0\.1$/,
];

export function isSafeImageUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url) return false;

  // Allow relative URLs (our proxy)
  if (url.startsWith('/')) return true;

  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== 'https:' &&
      parsed.hostname !== 'localhost' &&
      parsed.hostname !== '127.0.0.1'
    )
      return false;
    return ALLOWED_IMAGE_HOSTS.some((pattern) => pattern.test(parsed.hostname));
  } catch {
    return false;
  }
}
