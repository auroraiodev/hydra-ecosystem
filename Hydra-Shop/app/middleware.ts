import { NextRequest, NextResponse } from 'next/server';

const SKIP_PREFIXES = [
  '/_next',
  '/maintenance',
  '/api',
  '/uploads',
  '/favicon',
  '/icons',
  '/cat.png',
  '/sw.js',
  '/workbox-',
  '/offline',
];

function shouldSkip(pathname: string): boolean {
  return SKIP_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkip(pathname)) return NextResponse.next();

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || '';

  if (!ip) return NextResponse.next();

  try {
    const backendBase = (process.env.BACKEND_API_URL || 'http://127.0.0.1:3002').replace(/\/$/, '');
    const res = await fetch(
      `${backendBase}/api/v1/presence/check-ip?ip=${encodeURIComponent(ip)}`,
      {
        // Cache result for 60s to avoid a DB hit on every navigation
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(2000),
      },
    );

    if (res.ok) {
      const data = await res.json();
      if (data?.blocked) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
      }
    }
  } catch {
    // Fail open — never block a user if the check itself errors
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
