import { NextRequest, NextResponse } from 'next/server';
import { API_URL, AUTH_COOKIE_MAX_AGE, REFRESH_COOKIE_MAX_AGE } from '@/lib/constants/api';

/**
 * POST /api/auth/login
 *
 * Proxies email/password login to the backend and sets the JWT
 * as an httpOnly cookie so it is never accessible to client-side JS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch((err) => {
      console.error('[auth/login] JSON parse error:', err);
      return {};
    });

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // Unwrap the response — backend may return { success, data: { ... } } or flat
    let token: string | undefined;
    let user: unknown;
    let refreshToken: string | undefined;

    if (data.success && data.data) {
      token = data.data.accessToken || data.data.token;
      user = data.data.user;
      refreshToken = data.data.refreshToken;
    } else {
      token = data.accessToken || data.token;
      user = data.user;
      refreshToken = data.refreshToken;
    }

    if (!token) {
      return NextResponse.json({ error: 'No token in response' }, { status: 500 });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    // Return token in response body so the client can keep it in memory,
    // AND set it as an httpOnly cookie for persistence across page refreshes.
    const response = NextResponse.json({ success: true, data: { user, token, refreshToken } });

    response.cookies.set('__sid', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: AUTH_COOKIE_MAX_AGE,
      domain: cookieDomain,
    });

    if (refreshToken) {
      response.cookies.set('refresh-token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: REFRESH_COOKIE_MAX_AGE,
        domain: cookieDomain,
      });
    }

    return response;
  } catch (error) {
    console.error('[auth/login] Unexpected error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
