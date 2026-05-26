import { Buffer } from 'buffer';
import { NextResponse, type NextRequest } from 'next/server';

const BACKEND_URL = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:3002'
).replace('localhost', '127.0.0.1');

// Define legacy route mappings for 301 redirects
const REDIRECTS: Record<string, string> = {
  '/products': '/singles',
  '/market': '/singles',
  '/store': '/browse',
  '/categories': '/browse',
  '/home': '/',
};

async function getActiveTcgIds(): Promise<Set<string>> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/tcgs/active`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return new Set();
    const json = await res.json();
    const tcgs: { id: string }[] = json?.data ?? json ?? [];
    return new Set(tcgs.map((t) => t.id));
  } catch {
    return new Set();
  }
}

/**
 * Decode the JWT payload and verify the `exp` claim has not passed.
 * Does NOT verify the signature — that is the backend's job. We only
 * need to avoid granting a page visit to a probably-expired token.
 */
function isAuthTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (!payload.exp) return false;
    return Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Technical SEO: Check for legacy route redirects (301)
  for (const [oldPath, newPath] of Object.entries(REDIRECTS)) {
    if (pathname.startsWith(oldPath)) {
      const remainingPath = pathname.slice(oldPath.length);
      const url = request.nextUrl.clone();
      url.pathname = `${newPath}${remainingPath}`;
      return NextResponse.redirect(url, 301);
    }
  }

  // 2. Technical SEO: Trailing Slash Normalization (force no-trailing-slash)
  if (pathname !== '/' && pathname.endsWith('/') && !pathname.includes('.')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  // 3. Security & CSP
  // Next.js 16/Turbopack does not inject nonces into its own generated inline scripts,
  // so a nonce-based script-src blocks all of Next.js's bootstrap code. Use 'unsafe-inline'
  // with 'self' and 'https:' instead — standard practice for Next.js apps.
  const isDev = process.env.NODE_ENV === 'development';

  const scriptSrc = isDev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' https:`
    : `script-src 'self' 'unsafe-inline' 'unsafe-eval' https:`;

  const backendOrigin = (() => {
    try { return new URL(BACKEND_URL).origin; } catch { return BACKEND_URL; }
  })();

  const connectSrc = isDev
    ? `connect-src 'self' https://*.sentry.io https://sentry.io https://*.mercadopago.com https://*.mercadopago.com.mx https://*.mercadolibre.com https://api.scryfall.com http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*`
    : `connect-src 'self' https://*.sentry.io https://sentry.io https://*.mercadopago.com https://*.mercadopago.com.mx https://*.mercadolibre.com https://api.scryfall.com ${backendOrigin} ${backendOrigin.replace(/^http/, 'ws')}`;

  const cspHeader = `
    default-src 'self';
    ${scriptSrc};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob: ${BACKEND_URL} http://localhost:3002 http://127.0.0.1:3002 https://lh3.googleusercontent.com https://*.googleusercontent.com https://html.tailus.io https://svgs.scryfall.io https://files.hareruyamtg.com https://img.global.userapi.com https://m.media-amazon.com https://images.unsplash.com;
    ${connectSrc};
    frame-src 'self' https://*.mercadopago.com https://*.mercadopago.com.mx https://*.mercadolibre.com;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

  const response = NextResponse.next();

  // Refresh session if expired - required for Server Components
  const authTokenCookie = request.cookies.get('__sid');
  const hasValidAuthToken = authTokenCookie ? isAuthTokenValid(authTokenCookie.value) : false;

  // Protected routes
  const protectedPaths = ['/profile', '/checkout', '/wishlist', '/orders', '/sell', '/account'];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtectedPath && !hasValidAuthToken) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    if (authTokenCookie) {
      redirectResponse.cookies.delete('__sid');
    }
    // Set CSP even on redirects for consistency
    redirectResponse.headers.set('Content-Security-Policy', cspHeader);
    return redirectResponse;
  }

  // Block pages for disabled TCGs
  const tcgId = request.nextUrl.searchParams.get('tcgId');
  const TCG_SLUG_PREFIXES = ['/mtg/', '/pokemon/', '/yugioh/'];
  const isTcgScopedPath =
    request.nextUrl.pathname.startsWith('/singles') ||
    request.nextUrl.pathname.startsWith('/browse') ||
    TCG_SLUG_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p));

  if (tcgId && isTcgScopedPath) {
    const activeTcgIds = await getActiveTcgIds();
    if (activeTcgIds.size > 0 && !activeTcgIds.has(tcgId)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 4. Security Headers
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};

export default proxy;
