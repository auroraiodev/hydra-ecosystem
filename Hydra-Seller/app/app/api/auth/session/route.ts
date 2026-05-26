/**
 * Session verification endpoint.
 *
 * Reads the encrypted `__sid` httpOnly cookie, decrypts it, decodes the JWT
 * and returns the session info. This replaces localStorage-based auth checks
 * with a secure cookie-only flow.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { decryptCookie, COOKIE_NAME } from '@/lib/cookie-crypto';

export async function GET(request: NextRequest) {
  try {
    const raw = request.cookies.get(COOKIE_NAME)?.value;

    if (!raw) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const token = decryptCookie(raw);

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Decode JWT payload (base64url)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    );

    // 1. Verify token expiration (exp claim)
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      const response = NextResponse.json(
        { authenticated: false, error: 'Session expired' },
        { status: 200 }
      );
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // 2. Verify role authorization (must be SELLER or ADMIN)
    const role = payload.role?.toUpperCase();
    if (role !== 'SELLER' && role !== 'ADMIN') {
      const response = NextResponse.json(
        { authenticated: false, error: 'Unauthorized role' },
        { status: 200 }
      );
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    const user = {
      id: payload.sub,
      email: payload.email,
      role,
    };

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
