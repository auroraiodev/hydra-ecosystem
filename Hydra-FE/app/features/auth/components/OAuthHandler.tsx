'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { useToastContext } from '@/features/shared/components/ToastProvider';
import { fixUserData } from '@/lib/utils/encoding';
import { detectOriginApp, getRedirectUrlForRole, type OriginApp } from '@/lib/auth-redirect';

/**
 * Handles the ?auth= param injected by the OAuth callback route.
 * Must run on every page so that protected-page redirects (e.g. /wishlist)
 * work correctly after Google login.
 */
export function OAuthHandler() {
  return (
    <Suspense fallback={null}>
      <OAuthHandlerInner />
    </Suspense>
  );
}

function OAuthHandlerInner() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const { setCredentials } = useAuth();
  const { success: showSuccess } = useToastContext();
  const hasNotified = useRef(false);

  const authParam = searchParams.get('auth');
  const originApp: OriginApp = detectOriginApp();

  const { data: sessionData } = useQuery({
    queryKey: ['auth-session', authParam],
    queryFn: async () => {
      const res = await fetch('/api/auth/session');
      if (!res.ok) return null;
      return res.json() as Promise<{ token: string; user?: { role?: string } } | null>;
    },
    enabled: !!authParam,
  });

  const welcomeParam = searchParams.get('welcome');
  const oauthSuccessParam = searchParams.get('oauth_success');

  useEffect(() => {
    if (!authParam) {
      hasNotified.current = false;
      return;
    }

    if (!sessionData?.token) return;

    try {
      const decodedAuth = JSON.parse(atob(authParam));

      if (!decodedAuth.user) return;

      const fixedUser = fixUserData(decodedAuth.user);
      const roleName = typeof fixedUser.role === 'string' ? fixedUser.role : fixedUser.role?.name;
      const userRole = roleName?.toUpperCase() || 'CLIENT';

      setCredentials(fixedUser, sessionData.token);

      if (welcomeParam === 'true' && !hasNotified.current) {
        showSuccess('¡Bienvenido! Tu cuenta ha sido creada exitosamente.');
        hasNotified.current = true;
      } else if (oauthSuccessParam === 'true' && !hasNotified.current) {
        showSuccess('¡Sesión iniciada exitosamente!');
        hasNotified.current = true;
      }

      // Clean up URL params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('auth');
      newUrl.searchParams.delete('welcome');
      newUrl.searchParams.delete('oauth_success');
      newUrl.searchParams.delete('provider');

      // Check for stored redirect from sessionStorage
      const storedRedirect = sessionStorage.getItem('oauth_redirect');
      sessionStorage.removeItem('oauth_redirect');

      // Redirect based on role and origin app
      const targetUrl = getRedirectUrlForRole(userRole, originApp, storedRedirect);

      const currentOrigin = window.location.origin;
      const isRelative = targetUrl.startsWith('/');

      let isDifferent = false;
      if (isRelative) {
        isDifferent = window.location.pathname !== targetUrl;
      } else if (!targetUrl.startsWith(currentOrigin)) {
        isDifferent = true;
      } else {
        try {
          const targetPath = new URL(targetUrl).pathname;
          isDifferent = window.location.pathname !== targetPath;
        } catch {
          isDifferent = true;
        }
      }

      if (isDifferent) {
        window.location.href = targetUrl;
      } else {
        replace(newUrl.pathname + (newUrl.search || ''));
      }
    } catch (error) {
      console.error('[OAuthHandler] Error decoding auth param:', error);
    }
  }, [
    authParam,
    sessionData,
    welcomeParam,
    oauthSuccessParam,
    originApp,
    setCredentials,
    showSuccess,
    replace,
  ]);

  return null;
}
