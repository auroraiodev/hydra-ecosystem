import { NextRequest, NextResponse } from 'next/server';
import { encryptCookie, COOKIE_NAME } from '@/lib/cookie-crypto';

const AUTH_SERVICE_URL = (process.env.AUTH_SERVICE_URL || 'http://localhost:3004').replace('localhost', '127.0.0.1');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = request.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, baseUrl)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', baseUrl));
  }

  try {
    // Forward the OAuth callback to hydra-auth
    const callbackUrl = new URL(`${AUTH_SERVICE_URL}/auth/google/callback`);
    callbackUrl.searchParams.set('code', code);

    const authResponse = await fetch(callbackUrl.toString(), {
      method: 'GET',
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
      redirect: 'manual',
    });

    if (authResponse.status >= 300 && authResponse.status < 400) {
      const redirectLocation = authResponse.headers.get('location');
      if (redirectLocation) {
        const response = NextResponse.redirect(new URL(redirectLocation, baseUrl));
        copyAuthCookies(authResponse, response);
        return response;
      }
    }

    if (!authResponse.ok) {
      const errorText = await authResponse.text().catch(() => 'Unknown error');
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorText)}`, baseUrl)
      );
    }

    const authData = await authResponse.json();

    // Check if user has seller/admin role
    const userRole = authData.user?.role?.name || authData.user?.role;
    const allowedRoles = ['ADMIN', 'SELLER'];

    if (!userRole || !allowedRoles.includes(userRole.toUpperCase())) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent('Access denied. Seller dashboard is only for sellers and administrators.')}`,
          baseUrl
        )
      );
    }

    const redirectParams = new URLSearchParams();
    redirectParams.set('oauth_success', 'true');

    if (authData.user) {
      const encodedAuth = Buffer.from(
        JSON.stringify({ id: authData.user.id, email: authData.user.email })
      ).toString('base64');
      redirectParams.set('auth', encodedAuth);
    }

    const redirectUrl = new URL(`/dashboard?${redirectParams.toString()}`, baseUrl);
    const response = NextResponse.redirect(redirectUrl);

    // Set encrypted JWT cookie
    if (authData.accessToken) {
      response.cookies.set(COOKIE_NAME, encryptCookie(authData.accessToken), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    if (authData.refreshToken) {
      response.cookies.set('refresh-token', authData.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('[Seller OAuth Callback] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'OAuth failed';
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, baseUrl)
    );
  }
}

function copyAuthCookies(authResponse: Response, response: NextResponse) {
  const setCookie = authResponse.headers.get('set-cookie');
  if (setCookie) {
    response.headers.set('set-cookie', setCookie);
  }
}
