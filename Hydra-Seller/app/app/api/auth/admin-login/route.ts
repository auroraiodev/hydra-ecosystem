import { type NextRequest, NextResponse } from 'next/server';
import { COOKIE_MAX_AGE, REFRESH_COOKIE_MAX_AGE } from '@/lib/parse-expiry';
import { encryptCookie, COOKIE_NAME } from '@/lib/cookie-crypto';

const API_BASE_URL = (() => {
  const base =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3002/api';
  const normalized = base.replace('localhost', '127.0.0.1').replace(/\/+$/, '');
  return `${normalized}/v1`;
})();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const backendResponse = await fetch(`${API_BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ message: 'Login failed' }));
      return NextResponse.json(
        { message: errorData.message || errorData.error || 'Invalid credentials' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    const backendData = data?.data || data;

    const response = NextResponse.json({
      user: backendData.user,
      refreshToken: backendData.refreshToken,
    });

    if (backendData.accessToken) {
      response.cookies.set(COOKIE_NAME, encryptCookie(backendData.accessToken), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });

      // Plain role cookie — no sensitive data, readable by Edge middleware for redirects.
      // The backend verifies the full JWT on every API call; this is only for UX routing.
      const userRole = backendData.user?.role?.name || backendData.user?.role || '';
      if (userRole) {
        response.cookies.set('__role', userRole.toUpperCase(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: COOKIE_MAX_AGE,
        });
      }
    }

    if (backendData.refreshToken) {
      response.cookies.set('refresh-token', backendData.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: REFRESH_COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
