'use client';

import { useCallback, useTransition } from 'react';
import { detectOriginApp } from '@/lib/auth-redirect';

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3004';

export function useGoogleAuth() {
  const [isPending, startTransition] = useTransition();

  const initiateGoogleAuth = useCallback(async () => {
    if (isPending) return;

    startTransition(async () => {
      const originApp = detectOriginApp();
      sessionStorage.setItem('oauth_origin_app', originApp);

      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');

      if (redirectParam) {
        sessionStorage.setItem('oauth_redirect', redirectParam);
      }

      const origin = window.location.origin;
      const authUrl = new URL(`${AUTH_SERVICE_URL}/auth/google`);
      // Include /dashboard path so the auth service redirects back to the correct
      // page where OAuthHandler can process the oauth_success params.
      authUrl.searchParams.set('redirect_to', `${origin}/dashboard`);
      window.location.href = authUrl.toString();
    });
  }, [isPending]);

  return {
    initiateGoogleAuth,
    isLoading: isPending,
  };
}
