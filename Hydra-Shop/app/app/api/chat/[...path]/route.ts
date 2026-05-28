import { NextResponse, type NextRequest } from 'next/server';

const CHAT_URL = (
  process.env.CHAT_SERVICE_URL ||
  process.env.BACKEND_API_URL ||
  'http://127.0.0.1:3007'
).replace(/\/+$/, '');

async function handleProxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const relativePath = pathname.replace(/^\/api\/chat\//, '').replace(/^\/api\/chat$/, '');
  const targetUrl = `${CHAT_URL}/api/v1/chat/${relativePath}${search}`;

  try {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');

    const body = !['GET', 'HEAD'].includes(request.method)
      ? await request.blob()
      : undefined;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    const data = await response.blob();
    const resHeaders = new Headers(response.headers);
    resHeaders.delete('content-encoding');
    resHeaders.delete('content-length');
    resHeaders.delete('transfer-encoding');

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Chat service unreachable: ${message}` }, { status: 502 });
  }
}

export const GET    = handleProxy;
export const POST   = handleProxy;
export const PUT    = handleProxy;
export const PATCH  = handleProxy;
export const DELETE = handleProxy;
