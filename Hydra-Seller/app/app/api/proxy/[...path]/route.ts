/**
 * Universal API proxy — reads the encrypted httpOnly `__sid` cookie server-side
 * and forwards it as an Authorization: Bearer header to the Express backend.
 *
 * This prevents the JWT from ever being accessible from JavaScript running
 * in the browser (localStorage/sessionStorage).
 *
 * Usage: All data API calls in lib/api.ts use `/api/proxy/` as the base URL.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { decryptCookie, COOKIE_NAME } from '@/lib/cookie-crypto';

const getBackendBaseUrl = () => {
  const base =
    process.env.API_URL_INTERNAL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3002/api';

  const normalized = base.replace(/\/+$/, '').replace('localhost', '127.0.0.1');
  const withApi = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  return `${withApi}/v1`;
};

const BACKEND_BASE_URL = getBackendBaseUrl();

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] }
): Promise<NextResponse> {
  const raw = request.cookies.get(COOKIE_NAME)?.value;
  const token = raw ? decryptCookie(raw) : null;
  const path = params.path.join('/');
  const backendUrl = `${BACKEND_BASE_URL}/${path}${request.nextUrl.search}`;

  const forwardHeaders: Record<string, string> = {};

  // Forward content-type if present
  const contentType = request.headers.get('content-type');
  if (contentType) forwardHeaders['Content-Type'] = contentType;

  // Inject JWT from httpOnly cookie as Bearer token
  if (token) {
    forwardHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Forward original client IP for rate-limiting / audit logs
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) forwardHeaders['X-Forwarded-For'] = forwarded;

  const body =
    request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined;

  const backendResponse = await fetch(backendUrl, {
    method: request.method,
    headers: forwardHeaders,
    body,
  });

  // Stream response body
  const responseBody = await backendResponse.arrayBuffer();

  const responseHeaders = new Headers();
  const BLOCKED_HEADERS = [
    'set-cookie',
    'content-encoding',
    'content-length',
    'connection',
    'keep-alive',
    'transfer-encoding',
  ];

  backendResponse.headers.forEach((value, key) => {
    if (!BLOCKED_HEADERS.includes(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> | { path: string[] } };

const handler = async (request: NextRequest, context: RouteContext) => {
  try {
    // Support both Next.js 14 (sync) and 15+ (async) params
    const params = context.params instanceof Promise ? await context.params : context.params;
    return await proxyRequest(request, params);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Proxy Error:', {
      url: request.url,
      method: request.method,
      error: error?.message || error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Backend Unreachable',
        message: 'The Next.js proxy could not connect to the backend API.',
        debug: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 502 }
    );
  }
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
