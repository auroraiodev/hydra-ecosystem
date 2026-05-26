import { type NextRequest, NextResponse } from 'next/server';
import { COOKIE_MAX_AGE } from '@/lib/parse-expiry';
import { encryptCookie, COOKIE_NAME } from '@/lib/cookie-crypto';

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json();

    const authToken = request.cookies.get('__sid')?.value;

    if (!authToken) {
      return NextResponse.json({ message: 'Missing auth token' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME, encryptCookie(authToken), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    if (role) {
      response.cookies.set('__role', role.toUpperCase(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch (error) {
    console.error('OAuth session set error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
