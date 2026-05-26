'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch } from '@/lib/store';
import { setCredentials } from '@/lib/store/slices/authSlice';

function AuthCallbackContent() {
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  // auth service sends ?auth= via redirect_to path, ?user= via role-based fallback
  const rawParam = searchParams.get('auth') ?? searchParams.get('user');

  const user = rawParam
    ? (() => {
        try {
          const decoded = JSON.parse(atob(rawParam));
          // redirect_to path wraps payload as { user, accessToken }; fallback sends { user } directly
          return decoded.user ?? decoded;
        } catch {
          return null;
        }
      })()
    : null;

  const { data: token } = useQuery({
    queryKey: ['auth-callback-session'],
    queryFn: async () => {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      return data.token as string | undefined;
    },
    enabled: !!user,
  });

  const redirectUrl = rawParam
    ? (() => {
        const r = sessionStorage.getItem('oauth_redirect');
        sessionStorage.removeItem('oauth_redirect');
        return r && r.startsWith('/') ? r : '/';
      })()
    : null;

  useEffect(() => {
    if (!rawParam) {
      replace('/');
      return;
    }

    if (!token || !user) return;

    dispatch(setCredentials({ user, token }));
    replace(redirectUrl ?? '/');
  }, [rawParam, user, token, dispatch, replace, redirectUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Completando inicio de sesión…</p>
    </div>
  );
}

export function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Completando inicio de sesión…</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

export default AuthCallbackPage;
