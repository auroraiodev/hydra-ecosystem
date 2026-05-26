'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { safeProviderName } from '@/lib/sanitize';
import {
  getRedirectUrlForRole,
  detectOriginApp,
  canAccessApp,
  type OriginApp,
} from '@/lib/auth-redirect';

export function OAuthHandler() {
  const router = useRouter();
  const { push } = router;
  const hasProcessedOAuth = useRef(false);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const activeTimeouts = timeoutIds.current;
    if (hasProcessedOAuth.current) return;
    hasProcessedOAuth.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const welcome = urlParams.get('welcome');
    const provider = urlParams.get('provider');
    const authParam = urlParams.get('auth');
    const originApp: OriginApp = detectOriginApp();

    if (oauthSuccess || welcome) {
      if (authParam) {
        let decodedParam: string;
        try {
          decodedParam = decodeURIComponent(authParam);
        } catch {
          decodedParam = authParam;
        }

        let decodedJson: string;
        try {
          decodedJson = atob(decodedParam);
        } catch {
          toast.error('Error processing OAuth callback. Please try again.', { duration: 4000 });
          activeTimeouts.push(setTimeout(() => push('/login'), 1000));
          return () => {
            activeTimeouts.forEach(id => clearTimeout(id));
          };
        }

        let decodedObj: {
          accessToken?: string;
          token?: string;
          user?: {
            id?: string;
            email?: string;
            role?: string | { name?: string };
            roleName?: string;
            first_name?: string;
            last_name?: string;
            name?: string;
            avatar_url?: string | null;
            avatarUrl?: string;
            picture?: string;
          };
        };
        try {
          decodedObj = JSON.parse(decodedJson);
        } catch {
          toast.error('Error processing OAuth callback. Please try again.', { duration: 4000 });
          activeTimeouts.push(setTimeout(() => push('/login'), 1000));
          return () => {
            activeTimeouts.forEach(id => clearTimeout(id));
          };
        }

        const accessToken = decodedObj.accessToken || decodedObj.token;

        if (accessToken && decodedObj.user) {
          const rawRole = decodedObj.user.role;
          const userRole =
            (typeof rawRole === 'object' && rawRole ? rawRole.name : rawRole) ||
            decodedObj.user.roleName ||
            '';
          const normalizedRole = (userRole || '').toUpperCase();

          const redirectParam =
            sessionStorage.getItem('oauth_redirect') ||
            urlParams.get('redirect');

          // If the role cannot access this app, redirect to the correct app
          if (!canAccessApp(normalizedRole, originApp)) {
            const redirectUrl = getRedirectUrlForRole(normalizedRole, originApp, redirectParam);
            activeTimeouts.push(setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1500));
            return () => {
              activeTimeouts.forEach(id => clearTimeout(id));
            };
          }

          // Exchange token for httpOnly cookie
          fetch('/api/auth/admin-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ token: accessToken }),
          }).then((response) => {
            if (!response.ok) {
              toast.error('Error setting up session. Please try again.', { duration: 4000 });
              activeTimeouts.push(setTimeout(() => push('/login'), 1000));
              return;
            }

            activeTimeouts.push(
              setTimeout(() => {
                if (welcome) {
                  toast.success(
                    `Welcome! Your ${safeProviderName(provider)} account has been created.`,
                    { duration: 3000 }
                  );
                } else {
                  toast.success('Sign in successful!', { duration: 2000 });
                }

                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('oauth_success');
                newUrl.searchParams.delete('welcome');
                newUrl.searchParams.delete('provider');
                newUrl.searchParams.delete('auth');
                window.history.replaceState({}, '', newUrl.pathname + (newUrl.search || ''));

                if (redirectParam) sessionStorage.removeItem('oauth_redirect');

                const targetUrl = getRedirectUrlForRole(normalizedRole, originApp, redirectParam);
                window.location.href = targetUrl;
              }, 200)
            );
          }).catch(() => {
            toast.error('Error setting up session. Please try again.', { duration: 4000 });
            activeTimeouts.push(setTimeout(() => push('/login'), 1000));
          });
          return;
        }
      }

      // Fallback: check session via cookie
      activeTimeouts.push(
        setTimeout(() => {
          fetch('/api/auth/session', { credentials: 'include' })
            .then((response) => response.json())
            .then((data) => {
              if (data.authenticated) {
                const userRole = data.user?.role?.toUpperCase() || '';

                if (!canAccessApp(userRole, originApp)) {
                  const redirectParam = sessionStorage.getItem('oauth_redirect');
                  const redirectUrl = getRedirectUrlForRole(userRole, originApp, redirectParam);
                  window.location.href = redirectUrl;
                  return;
                }

                if (welcome) {
                  toast.success(
                    `Welcome! Your ${safeProviderName(provider)} account has been created.`,
                    { duration: 3000 }
                  );
                } else {
                  toast.success('Sign in successful!', { duration: 2000 });
                }

                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('oauth_success');
                newUrl.searchParams.delete('welcome');
                newUrl.searchParams.delete('provider');
                newUrl.searchParams.delete('auth');
                window.history.replaceState({}, '', newUrl.pathname + (newUrl.search || ''));

                const redirectParam = sessionStorage.getItem('oauth_redirect');
                if (redirectParam) sessionStorage.removeItem('oauth_redirect');

                const targetUrl = getRedirectUrlForRole(userRole, originApp, redirectParam);
                window.location.href = targetUrl;
              } else {
                toast.error('Error signing in. Please try again.', { duration: 3000 });
                push('/login');
              }
            })
            .catch(() => {
              toast.error('Error signing in. Please try again.', { duration: 3000 });
              push('/login');
            });
        }, 100)
      );
    }

    return () => {
      activeTimeouts.forEach(id => clearTimeout(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
