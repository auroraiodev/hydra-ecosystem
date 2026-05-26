import { type NextRequest, NextResponse } from 'next/server';
import { COOKIE_MAX_AGE, REFRESH_COOKIE_MAX_AGE } from '@/lib/parse-expiry';
import { encryptCookie, COOKIE_NAME } from '@/lib/cookie-crypto';
import { BACKEND_BASE_URL } from '@/lib/api-config';

export async function POST(request: NextRequest) {
  try {
    const rawRefreshToken = request.cookies.get('refresh-token')?.value;

    if (!rawRefreshToken) {
      return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
    }

    const backendResponse = await fetch(`${BACKEND_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rawRefreshToken }),
    });

    const data = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok) {
      const resp = NextResponse.json({ message: 'Refresh failed' }, { status: 401 });
      resp.cookies.delete(COOKIE_NAME);
      resp.cookies.delete('refresh-token');
      return resp;
    }

    const response = NextResponse.json({ success: true, token: data.accessToken });

    response.cookies.set(COOKIE_NAME, encryptCookie(data.accessToken), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    response.cookies.set('refresh-token', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error('Admin refresh error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
