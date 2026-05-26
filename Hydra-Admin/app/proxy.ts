import { NextRequest, NextResponse } from 'next/server';

// Only ADMIN can access the admin dashboard.
// SELLERs have their own app (hydra-seller).
const ADMIN_ONLY_ROLES = ['ADMIN'];

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

  if (!ADMIN_ONLY_ROLES.includes(role) && !isOauthCallback) {
    if (role === 'SELLER') {
      const sellerUrl = process.env.NEXT_PUBLIC_SELLER_URL || 'http://localhost:3003';
      return NextResponse.redirect(sellerUrl);
    }
    const feUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    return NextResponse.redirect(feUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};

export default proxy;
