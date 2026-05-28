/**
 * Proxy for hydra-chat REST API.
 * Routes /api/proxy/chat/* → CHAT_SERVICE_URL/api/v1/chat/*
 * Takes precedence over the universal /api/proxy/[...path] catch-all.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { decryptCookie, COOKIE_NAME } from '@/lib/cookie-crypto';

const CHAT_URL = (
  process.env.CHAT_SERVICE_URL ||
  'http://127.0.0.1:3007'
).replace(/\/+$/, '');

async function proxyRequest(request: NextRequest, params: { path: string[] }): Promise<NextResponse> {
  const raw = request.cookies.get(COOKIE_NAME)?.value;
  const token = raw ? decryptCookie(raw) : null;
  const path = params.path.join('/');
  const targetUrl = `${CHAT_URL}/api/v1/chat/${path}${request.nextUrl.search}`;

  const headers: Record<string, string> = {};
  const contentType = request.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) headers['X-Forwarded-For'] = forwarded;

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.arrayBuffer()
      : undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseBody = await response.arrayBuffer();
    const resHeaders = new Headers();
    const blocked = ['set-cookie', 'content-encoding', 'content-length', 'connection', 'keep-alive', 'transfer-encoding'];
    response.headers.forEach((value, key) => {
      if (!blocked.includes(key.toLowerCase())) resHeaders.set(key, value);
    });

    return new NextResponse(responseBody, { status: response.status, headers: resHeaders });
  } catch (error: any) {
    clearTimeout(timeout);
    return NextResponse.json({ success: false, error: 'Chat service unreachable', message: error?.message }, { status: 502 });
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

const handler = async (request: NextRequest, context: RouteContext) => {
  const params = await context.params;
  return proxyRequest(request, params);
};

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;
export const OPTIONS = handler;
