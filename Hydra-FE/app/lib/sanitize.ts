/**
 * Shared sanitization utilities — mirrors hydra-admin/lib/sanitize.ts.
 * React JSX escapes HTML by default; these cover remaining attack surfaces:
 * URL attributes, URL query params, and allowlist-controlled strings.
 */

// @knip-ignore - unused export kept for reference
// /** Allowed OAuth provider identifiers → display names. */
// const PROVIDER_NAMES: Record<string, string> = {
//   google: 'Google',
//   github: 'GitHub',
//   azure: 'Microsoft',
//   apple: 'Apple',
// };

// @knip-ignore - unused export kept for reference
// export function safeProviderName(raw: string | null | undefined): string {
//   if (!raw) return 'OAuth';
//   return PROVIDER_NAMES[raw.toLowerCase().trim()] ?? 'OAuth';
// }

/**
 * Sanitizes an error string from a URL query parameter.
 * Strips angle brackets and control chars, caps at 200 chars.
 */
export function sanitizeUrlError(raw: string | null | undefined): string {
  if (!raw) return '';
  try {
    const decoded = decodeURIComponent(raw);
    return decoded
      .replace(/[<>"'`]/g, '')
      .trim()
      .slice(0, 200);
  } catch {
    return 'An error occurred. Please try again.';
  }
}

/**
 * Validates a URL is safe for use as <img src>.
 * Allows only https: from a known allowlist — blocks data:, javascript:, blob:, unknown origins.
 */
const ALLOWED_IMAGE_HOSTS = [
  /^cards\.scryfall\.io$/,
  /^[a-z0-9-]+\.scryfall\.io$/,
  /^[a-z0-9-]+\.scryfall\.com$/,
  /^lh3\.googleusercontent\.com$/,
  /^[a-z0-9-]+\.googleusercontent\.com$/,
  /^[a-z0-9-]+\.hareruyamtg\.com$/,
  /^m\.media-amazon\.com$/,
  /^images\.unsplash\.com$/,
  /^files\.hareruyamtg\.com$/,
];

export function isSafeImageUrl(url: string | null | undefined): boolean {
  if (typeof url !== 'string' || !url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_IMAGE_HOSTS.some((p) => p.test(parsed.hostname));
  } catch {
    return false;
  }
}
