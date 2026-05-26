import { NextRequest, NextResponse } from 'next/server';
import { API_URL, AUTH_COOKIE_MAX_AGE, REFRESH_COOKIE_MAX_AGE } from '@/lib/constants/api';

export async function POST(request: NextRequest) {
  try {
    const rawRefreshToken = request.cookies.get('refresh-token')?.value;

    if (!rawRefreshToken) {
      return NextResponse.json({ error: 'No refresh token available' }, { status: 401 });
    }

    const backendRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rawRefreshToken }),
    });

    const data = await backendRes.json().catch(() => ({}));

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    if (!backendRes.ok) {
      const resp = NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
      // Clear host-level cookies
      resp.cookies.set('__sid', '', { path: '/', maxAge: 0 });
      resp.cookies.set('refresh-token', '', { path: '/', maxAge: 0 });
      
      // Clear domain-level cookies
      if (cookieDomain) {
        resp.cookies.set('__sid', '', { path: '/', maxAge: 0, domain: cookieDomain });
        resp.cookies.set('refresh-token', '', { path: '/', maxAge: 0, domain: cookieDomain });
      }
      return resp;
    }

    const { accessToken, refreshToken } = data;

    const response = NextResponse.json({ success: true, token: accessToken });

    response.cookies.set('__sid', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: AUTH_COOKIE_MAX_AGE,
      domain: cookieDomain,
    });

    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: REFRESH_COOKIE_MAX_AGE,
      domain: cookieDomain,
    });

    return response;
  } catch (error) {
    console.error('[auth/refresh] Unexpected error:', error);
    return NextResponse.json({ error: 'Refresh failed due to internal error' }, { status: 500 });
  }
}
