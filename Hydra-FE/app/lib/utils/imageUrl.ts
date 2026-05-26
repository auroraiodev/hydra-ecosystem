/**
 * Rewrites old direct S3/Garage public URLs to backend proxy URLs.
 * This keeps S3 objects private while still serving images through the API.
 */
const S3_PUBLIC_URL_PATTERN = /https:\/\/web-[^/]+\.sslip\.io\/(?:hydra\/)?(.+)/;

export function resolveImageUrl(url: string | null | undefined): string {
  if (typeof url !== 'string') return '';
  if (!url) return '';

  // 1. If it's already a data URL, pass through
  if (url.startsWith('data:')) {
    return url;
  }

  // Intercept and rewrite legacy supplier URLs to the clean local proxy
  const _sh = atob('aGFyZXJ1eWFtdGcuY29t');
  if (url.includes(_sh)) {
    const parts = url.split(_sh + '/');
    const path = parts[parts.length - 1];
    return `/api/images/external?path=${encodeURIComponent(path)}`;
  }

  // 2. Handle legacy or admin-generated proxy paths
  if (url.startsWith('/api/proxy/')) {
    // Convert admin's /api/proxy/ to FE's /api/
    return url.replace('/api/proxy/', '/api/');
  }

  // 3. If it's already a relative proxy path, pass through
  if (url.startsWith('/api/images/') || url.startsWith('/uploads/')) {
    return url;
  }

  // 4. Identify backend base URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  const backendBase = apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  // 5. Handle full backend URLs by converting them to relative proxy paths
  const isBackendUrl =
    url.startsWith(backendBase) ||
    url.startsWith('http://127.0.0.1:3002') ||
    url.startsWith('http://localhost:3002') ||
    url.startsWith('https://api.hydracollect.com') ||
    url.startsWith('https://qa-api.hydracollect.com');

  if (isBackendUrl) {
    const normalizedUrl = url
      .replace('http://127.0.0.1:3002', backendBase)
      .replace('http://localhost:3002', backendBase)
      .replace('https://api.hydracollect.com', backendBase)
      .replace('https://qa-api.hydracollect.com', backendBase);

    const relativePart = normalizedUrl.replace(backendBase, '');

    // Convert /api/v1/images/... to /api/images/...
    if (relativePart.startsWith('/api/v1/images/')) {
      return relativePart.replace('/api/v1/images/', '/api/images/');
    }

    // Pass through /uploads/... (will be handled by next.config rewrites)
    if (relativePart.startsWith('/uploads/')) {
      return relativePart;
    }

    // Convert any other /api/v1/... to /api/...
    if (relativePart.startsWith('/api/v1/')) {
      return relativePart.replace('/api/v1/', '/api/');
    }

    return relativePart;
  }

  // 6. Handle strings that contain the proxy marker but aren't full URLs
  const proxyMarker = '/api/v1/images/';
  if (url.includes(proxyMarker)) {
    const parts = url.split(proxyMarker);
    const key = parts[parts.length - 1];
    return `/api/images/${key}`;
  }

  // 7. Handle local uploads path in the string
  if (url.includes('/uploads/')) {
    const parts = url.split('/uploads/');
    const key = parts[parts.length - 1];
    return `/uploads/${key}`;
  }

  // 8. Rewrite old S3 public URLs to proxy URLs
  const match = url.match(S3_PUBLIC_URL_PATTERN);
  if (match) {
    const key = match[1];
    return `/api/images/${key}`;
  }

  // 9. If it's a relative path/key (doesn't start with / and is not a full URL)
  if (!url.startsWith('/') && !url.includes('://')) {
    // Default to assuming it's an image key served via ImagesController
    return `/api/images/${url}`;
  }

  return url;
}
