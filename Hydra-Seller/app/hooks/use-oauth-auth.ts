'use client';

import { useState } from 'react';
const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3004';

interface UseOAuthAuthOptions {
  actionType?: 'login' | 'signup';
  isSubmitting?: boolean;
}

interface UseOAuthAuthReturn {
  handleOAuthAuth: (provider: string) => Promise<void>;
  oauthLoading: string | null;
  oauthError: string | null;
}

export function useOAuthAuth({
  actionType = 'login',
  isSubmitting = false,
}: UseOAuthAuthOptions = {}): UseOAuthAuthReturn {
  const [oauthLoading, setOAuthLoading] = useState<string | null>(null);
  const [oauthError, setOAuthError] = useState<string | null>(null);

  const handleOAuthAuth = async (provider: string) => {
    if (oauthLoading || isSubmitting) return;

    setOAuthLoading(provider);
    setOAuthError(null);

    try {
      const origin = window.location.origin;

      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');
      if (redirectParam) {
        sessionStorage.setItem('oauth_redirect', redirectParam);
      }

      const authUrl = new URL(`${AUTH_SERVICE_URL}/auth/google`);
      // Include /dashboard path so the auth service redirects back to the correct
      // page where OAuthHandler can process the oauth_success params.
      authUrl.searchParams.set('redirect_to', `${origin}/dashboard`);

      if (provider === 'google') {
        window.location.href = authUrl.toString();
      } else {
        setOAuthError(`Provider ${provider} not supported`);
        setOAuthLoading(null);
      }
    } catch {
      const errorMessage =
        actionType === 'login' ? 'Error signing in with OAuth' : 'Error signing up with OAuth';
      setOAuthError(errorMessage);
      setOAuthLoading(null);
    }
  };

  return {
    handleOAuthAuth,
    oauthLoading,
    oauthError,
  };
}
