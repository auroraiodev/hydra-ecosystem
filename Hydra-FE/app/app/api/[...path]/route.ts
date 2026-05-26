import { NextResponse, type NextRequest } from 'next/server';

const API_URL = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:3002'
)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

/**
 * Catch-all proxy route for hydra-fe.
 * Proxies requests to the backend API.
 */
export async function GET(request: NextRequest) {
  return handleProxy(request);
}

export async function POST(request: NextRequest) {
  return handleProxy(request);
}

export async function PUT(request: NextRequest) {
  return handleProxy(request);
}

export async function PATCH(request: NextRequest) {
  return handleProxy(request);
}

export async function DELETE(request: NextRequest) {
  return handleProxy(request);
}

async function handleProxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Strip the leading /api prefix
  const relativePath = pathname.replace(/^\/api\//, '');
  const targetUrl = `${API_URL}/api/v1/${relativePath}${search}`;

  console.log(`[PROXY] ${request.method} ${pathname} -> ${targetUrl}`);

  try {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');

    let body: BodyInit | undefined;
    if (!['GET', 'HEAD'].includes(request.method)) {
      body = await request.blob();
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    console.log(`[PROXY RES] ${response.status} ${response.statusText}`);

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
    console.error(`[PROXY ERROR] ${request.method} ${pathname}:`, message);
    return NextResponse.json(
      {
        success: false,
        error: `Proxy request failed: ${message}`,
        targetUrl,
        method: request.method,
      },
      { status: 502 }
    );
  }
}
