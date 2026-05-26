import { type NextRequest, NextResponse } from 'next/server';
import { encryptCookie, COOKIE_NAME } from '@/lib/cookie-crypto';
import { COOKIE_MAX_AGE } from '@/lib/parse-expiry';

const getApiBaseUrl = () => {
  const base =
    process.env.API_URL_INTERNAL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3002/api';

  const normalized = base.replace(/\/+$/, '');
  const withApi = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  return `${withApi}/v1`;
};

const API_BASE_URL = getApiBaseUrl();

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ message: 'Token is required' }, { status: 400 });
    }

    // Validate the token by calling the backend
    const backendResponse = await fetch(`${API_BASE_URL}/auth/admin-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!backendResponse.ok) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, encryptCookie(token), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    // Set __role cookie so that Next.js middleware can read it for redirects.
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64url').toString('utf8')
        );
        const role = payload.role?.toUpperCase();
        if (role) {
          response.cookies.set('__role', role, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: COOKIE_MAX_AGE,
          });
        }
      } catch (e) {
        console.error('Failed to parse token payload in admin-session:', e);
      }
    }

    return response;
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
