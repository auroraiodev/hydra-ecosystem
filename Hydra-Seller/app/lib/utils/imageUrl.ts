/**
 * Rewrites old direct S3/Garage public URLs to backend proxy URLs.
 * This keeps S3 objects private while still serving images through the API.
 */
const S3_PUBLIC_URL_PATTERN = /https:\/\/web-[^/]+\.sslip\.io\/(?:hydra\/)?(.+)/;

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';

  // 1. If it's already a relative path or data URL, pass through
  if (url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }

  // 2. Identify backend base URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  const backendBase = apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  // 3. If the URL contains our proxy pattern, normalize it to a relative path
  // In hydra-seller, the proxy base is /api/proxy/
  const proxyMarker = '/api/v1/images/';
  if (url.includes(proxyMarker)) {
    const parts = url.split(proxyMarker);
    const key = parts[parts.length - 1];
    return `/api/proxy/images/${key}`;
  }

  // 4. Rewrite old S3 public URLs to proxy URLs
  const match = url.match(S3_PUBLIC_URL_PATTERN);
  if (match) {
    const key = match[1];
    return `/api/proxy/images/${key}`;
  }

  // 5. If it starts with the backend base but wasn't caught by the proxy marker
  if (url.startsWith(backendBase)) {
    const relativePart = url.replace(backendBase, '');
    if (relativePart.startsWith('/api/v1/')) {
      return relativePart.replace('/api/v1/', '/api/proxy/');
    }
    return relativePart;
  }

  return url;
}
