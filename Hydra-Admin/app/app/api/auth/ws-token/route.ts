/**
 * Decrypts the httpOnly __sid cookie and returns the raw JWT as JSON.
 * Used exclusively by useChatAdmin to authenticate the Socket.io connection,
 * since WebSocket connections cannot use httpOnly cookies directly.
 * Security: same-origin only, requires the cookie to exist (set by admin-login).
 */
import { type NextRequest, NextResponse } from 'next/server';
import { decryptCookie, COOKIE_NAME } from '@/lib/cookie-crypto';

export async function GET(request: NextRequest) {
  const raw = request.cookies.get(COOKIE_NAME)?.value;
  const token = raw ? decryptCookie(raw) : null;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({ token });
}
