import { Buffer } from 'buffer';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/session
 *
 * Reads the httpOnly __sid cookie and returns the token to the client
 * so it can be kept in memory (tokenStore) without ever hitting localStorage.
 * Called once on app init to restore auth state after a page refresh.
 */
export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('__sid')?.value;

  if (!authToken) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  // Validate expiry via JWT payload decode (no secret needed — just checking exp claim)
  try {
    const parts = authToken.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT structure');

    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    );

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
      const response = NextResponse.json({ authenticated: false }, { status: 200 });
      
      // Clear host-level session cookie
      response.cookies.set('__sid', '', { path: '/', maxAge: 0 });
      
      // Clear domain-level session cookie
      if (cookieDomain) {
        response.cookies.set('__sid', '', { path: '/', maxAge: 0, domain: cookieDomain });
      }
      return response;
    }
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({ authenticated: true, token: authToken });
}
