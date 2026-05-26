import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 *
 * Clears the httpOnly __sid cookie.
 * Called by the client during logout to remove server-side token persistence.
 */
export async function POST() {
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
  const response = NextResponse.json({ success: true });

  // Clear host-level cookies
  response.cookies.set('__sid', '', { path: '/', maxAge: 0 });
  response.cookies.set('refresh-token', '', { path: '/', maxAge: 0 });

  // Clear domain-level cookies
  if (cookieDomain) {
    response.cookies.set('__sid', '', { path: '/', maxAge: 0, domain: cookieDomain });
    response.cookies.set('refresh-token', '', { path: '/', maxAge: 0, domain: cookieDomain });
  }

  return response;
}
