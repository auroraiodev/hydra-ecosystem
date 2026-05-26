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
import { appendFileSync } from 'fs';
import { join } from 'path';
import { decryptCookie, COOKIE_NAME } from '@/lib/cookie-crypto';
import { BACKEND_BASE_URL, BACKEND_ROOT_URL } from '@/lib/api-config';

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] }
): Promise<NextResponse> {
  const raw = request.cookies.get(COOKIE_NAME)?.value;
  const token = raw ? decryptCookie(raw) : null;
  const path = params.path.join('/');

  // If the path starts with 'uploads', use the root backend URL (no /api/v1 prefix)
  const baseUrl = path.startsWith('uploads/') ? BACKEND_ROOT_URL : BACKEND_BASE_URL;
  const backendUrl = `${baseUrl}/${path}${request.nextUrl.search}`;

  // DEBUG BACKEND URL
  try {
    const log = `[PROXY FETCH] ${new Date().toISOString()} | Fetching: ${backendUrl}\n`;
    appendFileSync(join(process.cwd(), 'proxy_debug.log'), log);
  } catch {}

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

  const PROXY_TIMEOUT = 15000;
  const MAX_RETRIES = request.method === 'GET' || request.method === 'HEAD' ? 2 : 0;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT);
    try {
      const backendResponse = await fetch(backendUrl, {
        method: request.method,
        headers: forwardHeaders,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

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
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error('Proxy fetch failed');
}

type RouteContext = { params: Promise<{ path: string[] }> | { path: string[] } };

const handler = async (request: NextRequest, context: RouteContext) => {
  try {
    // Support both Next.js 14 (sync) and 15+ (async) params
    const params = context.params instanceof Promise ? await context.params : context.params;

    // DEBUG LOGGING
    try {
      const path = params.path.join('/');
      const logMessage = `[PROXY IN] ${new Date().toISOString()} | ${request.method} ${request.url} | path: ${path}\n`;
      appendFileSync(join(process.cwd(), 'proxy_debug.log'), logMessage);
    } catch {}

    return await proxyRequest(request, params);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Proxy Error:', {
      url: request.url,
      method: request.method,
      error: error?.message || error,
    });

    // DEBUG ERROR LOGGING
    try {
      const log = `[PROXY ERROR] ${new Date().toISOString()} | ${request.url} | ${error?.message || error}\n`;
      appendFileSync(join(process.cwd(), 'proxy_debug.log'), log);
    } catch {}

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
