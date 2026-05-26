import { Buffer } from 'buffer';
import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE_URL = (process.env.AUTH_SERVICE_URL || 'http://localhost:3004').replace('localhost', '127.0.0.1');
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const pendingRedirect = searchParams.get('redirect');

  const baseUrl = request.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, baseUrl)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', baseUrl));
  }

  // Exchange the authorization code for tokens at hydra-auth
  try {
    // Forward code, state, and any other OAuth params the provider appended
    const tokenResponse = await fetch(`${AUTH_SERVICE_URL}/auth/google/callback${request.nextUrl.search}`, {
      method: 'GET',
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
      redirect: 'manual',
    });

    // hydra-auth will redirect back with cookies set
    if (tokenResponse.status >= 300 && tokenResponse.status < 400) {
      const redirectUrl = tokenResponse.headers.get('location');
      if (redirectUrl) {
        const response = NextResponse.redirect(new URL(redirectUrl, baseUrl));
        // Copy cookies from hydra-auth response
        const setCookie = tokenResponse.headers.get('set-cookie');
        if (setCookie) {
          response.headers.set('set-cookie', setCookie);
        }
        return response;
      }
    }

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text().catch(() => 'Unknown error');
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorText)}`, baseUrl)
      );
    }

    const authData = await tokenResponse.json();

    const redirectParams = new URLSearchParams();
    if (authData.user) {
      const encodedAuth = Buffer.from(JSON.stringify({ user: authData.user })).toString('base64');
      redirectParams.set('auth', encodedAuth);
    }
    redirectParams.set('oauth_success', 'true');

    const destination = pendingRedirect && pendingRedirect.startsWith('/') ? pendingRedirect : '/';
    const redirectUrl = new URL(destination, baseUrl);
    redirectUrl.search = redirectParams.toString();

    const response = NextResponse.redirect(redirectUrl);

    // Copy auth cookies from hydra-auth
    const setCookie = tokenResponse.headers.get('set-cookie');
    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }

    return response;
  } catch (error) {
    console.error('[OAuth Callback] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'OAuth failed';
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, baseUrl)
    );
  }
}
