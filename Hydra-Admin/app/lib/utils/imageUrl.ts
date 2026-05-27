/**
 * Rewrites old direct S3/Garage public URLs to backend proxy URLs.
 * This keeps S3 objects private while still serving images through the API.
 */
const S3_PUBLIC_URL_PATTERN = /https:\/\/web-[^/]+\.sslip\.io\/(?:hydra\/)?(.+)/;

/**
 * Resolves an image URL or key to a proxied URL for the browser to fetch.
 */
export function resolveImageUrl(url: string | null | undefined | unknown): string {
  if (typeof url !== 'string') return '';
  if (!url) return '';

  // 1. If it's already a data URL or blob URL, pass through
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // 2. If it's already a proxy URL, pass through
  if (url.startsWith('/api/proxy/')) {
    return url;
  }

  // 3. Identify backend base URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  const backendBase = apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  // 4. Handle paths that include the API proxy marker
  if (url.includes('/api/v1/images/')) {
    const parts = url.split('/api/v1/images/');
    const key = parts[parts.length - 1];
    return `/api/proxy/images/${key}`;
  }
  if (url.includes('/api/images/')) {
    const parts = url.split('/api/images/');
    const key = parts[parts.length - 1];
    return `/api/proxy/images/${key}`;
  }

  // 5. Handle local uploads path
  if (url.includes('/uploads/')) {
    const parts = url.split('/uploads/');
    const key = parts[parts.length - 1];
    return `/api/proxy/uploads/${key}`;
  }

  // 6. Rewrite old S3 public URLs to proxy URLs
  const match = url.match(S3_PUBLIC_URL_PATTERN);
  if (match) {
    const key = match[1];
    return `/api/proxy/images/${key}`;
  }

  // 7. If it's a full URL to the backend, normalize it
  const isBackendUrl =
    url.startsWith(backendBase) ||
    url.startsWith('http://127.0.0.1:3002') ||
    url.startsWith('http://localhost:3002') ||
    url.startsWith('https://api.hydracollect.com');

  if (isBackendUrl) {
    const normalizedUrl = url
      .replace('http://127.0.0.1:3002', backendBase)
      .replace('http://localhost:3002', backendBase)
      .replace('https://api.hydracollect.com', backendBase);
    const relativePart = normalizedUrl.replace(backendBase, '');

    if (relativePart.startsWith('/api/v1/')) {
      return relativePart.replace('/api/v1/', '/api/proxy/');
    }
    if (relativePart.startsWith('/uploads/')) {
      return `/api/proxy${relativePart}`;
    }
    return relativePart;
  }

  // 8. If it's a relative path/key (doesn't start with / and is not a full URL)
  if (!url.startsWith('/') && !url.includes('://')) {
    // Default to assuming it's an image key
    return `/api/proxy/images/${url}`;
  }

  return url;
}

/**
 * Strips the local proxy prefix from a URL before saving it to the database.
 * This ensures we store the original backend URL or key.
 */
export function stripProxyUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  const backendBase = apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  if (url.startsWith('/api/proxy/images/')) {
    const key = url.replace('/api/proxy/images/', '');
    return `${backendBase}/api/v1/images/${key}`;
  }

  if (url.startsWith('/api/proxy/uploads/')) {
    const key = url.replace('/api/proxy/uploads/', '');
    return `${backendBase}/uploads/${key}`;
  }

  if (url.startsWith('/api/proxy/')) {
    const relative = url.replace('/api/proxy/', '');
    return `${backendBase}/api/v1/${relative}`;
  }

  return url;
}
