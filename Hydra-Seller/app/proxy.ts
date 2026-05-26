import { NextRequest, NextResponse } from 'next/server';

// Both ADMIN and SELLER can use the seller dashboard.
const ALLOWED_ROLES = ['ADMIN', 'SELLER'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/profile')) {
    return NextResponse.next();
  }

  // __role is set by /api/auth/admin-login alongside the encrypted __sid cookie.
  // It contains only the role name — no sensitive data. Used here for redirect decisions.
  let role = request.cookies.get('__role')?.value?.toUpperCase() ?? '';
  const sid = request.cookies.get('__sid')?.value;

  // Fallback: If __role cookie is missing but __sid is a raw JWT, extract the role directly from its payload.
  if (!role && sid && sid.startsWith('eyJ')) {
    try {
      const parts = sid.split('.');
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        role = payload.role?.toUpperCase() || '';
      }
    } catch {
      // ignore decoding errors
    }
  }

  const isOauthCallback = request.nextUrl.searchParams.get('oauth_success') === 'true';

  if (!sid && !isOauthCallback) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!ALLOWED_ROLES.includes(role) && !isOauthCallback) {
    // CLIENT or unknown role — send to marketplace
    const feUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    return NextResponse.redirect(feUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};

export default proxy;
