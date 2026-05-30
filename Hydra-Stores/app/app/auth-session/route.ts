import { type NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/cookie-crypto';

export async function GET(request: NextRequest) {
  try {
    const raw = request.cookies.get(COOKIE_NAME)?.value;

    if (!raw) {
      console.log('[Session API] No raw cookie found');
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Decode JWT payload (base64url / base64) — no secret required to check structure/expiration
    const parts = raw.split('.');
    if (parts.length !== 3) {
      console.warn('[Session API] Invalid JWT structure');
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    let payload: any;
    try {
      payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
      );
    } catch (e) {
      console.error('[Session API] Failed to parse JWT payload:', e);
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    console.log('[Session API] Decoded payload:', {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      exp: payload.exp,
      currentTime: Math.floor(Date.now() / 1000),
    });

    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    // 1. Verify token expiration (exp claim)
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.warn('[Session API] Token expired');
      const response = NextResponse.json(
        { authenticated: false, error: 'Session expired' },
        { status: 200 }
      );
      response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
      if (cookieDomain) {
        response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0, domain: cookieDomain });
      }
      return response;
    }

    // 2. Fetch profile from the NestJS backend to verify the user role in the database
    const base =
      process.env.API_URL_INTERNAL ||
      process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:3002/api';

    const normalized = base.replace(/\/+$/, '');
    const withApi = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
    const backendUrl = `${withApi}/v1/users/profile`;

    const profileRes = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${raw}`,
      },
      cache: 'no-store',
    });

    if (!profileRes.ok) {
      console.warn('[Session API] Backend profile validation failed:', profileRes.status);
      const response = NextResponse.json(
        { authenticated: false, error: 'Backend validation failed' },
        { status: 200 }
      );
      response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
      if (cookieDomain) {
        response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0, domain: cookieDomain });
      }
      return response;
    }

    const dbUser = await profileRes.json();

    // 3. Verify role authorization (must be SELLER or ADMIN in database)
    const role = dbUser.role?.name?.toUpperCase();
    if (role !== 'SELLER' && role !== 'ADMIN') {
      console.warn('[Session API] Unauthorized database role:', role);
      const response = NextResponse.json(
        { authenticated: false, error: 'Unauthorized role' },
        { status: 200 }
      );
      response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
      if (cookieDomain) {
        response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0, domain: cookieDomain });
      }
      return response;
    }

    const user = {
      id: dbUser.id,
      email: dbUser.email,
      role,
      first_name: dbUser.first_name,
      last_name: dbUser.last_name,
      avatar_url: dbUser.avatar_url,
    };

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error('[Session API Error]:', error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
