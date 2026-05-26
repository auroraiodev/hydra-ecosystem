import { type NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (() => {
  const base =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3002/api';
  const normalized = base.replace('localhost', '127.0.0.1').replace(/\/+$/, '');
  return `${normalized}/v1`;
})();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Call the backend auth API
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
      return NextResponse.json(
        { message: errorData.message || errorData.error || 'Invalid credentials' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Only ADMIN users can access the admin dashboard.
    // Sellers have their own dedicated platform.
    const userRole = data.user?.role?.name || data.user?.roleName || data.user?.role;

    if (!userRole || userRole.toUpperCase() !== 'ADMIN') {
      return NextResponse.json(
        {
          message: 'Acceso denegado. El panel de administración es exclusivo para administradores.',
        },
        { status: 403 }
      );
    }

    // Return the token and user data from the backend
    return NextResponse.json({
      token: data.token || data.accessToken,
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
