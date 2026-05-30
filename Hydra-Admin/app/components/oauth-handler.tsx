'use client';

import { useReducer, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { safeProviderName } from '@/lib/sanitize';
import {
  getRedirectUrlForRole,
  detectOriginApp,
  canAccessApp,
  type OriginApp,
} from '@/lib/auth-redirect';

interface OAuthState {
  isProcessing: boolean;
  timeoutIds: ReturnType<typeof setTimeout>[];
}

type OAuthAction =
  | { type: 'START' }
  | { type: 'ADD_TIMEOUT'; id: ReturnType<typeof setTimeout> }
  | { type: 'CLEANUP' };

function oauthReducer(state: OAuthState, action: OAuthAction): OAuthState {
  switch (action.type) {
    case 'START':
      return { ...state, isProcessing: true };
    case 'ADD_TIMEOUT':
      return { ...state, timeoutIds: [...state.timeoutIds, action.id] };
    case 'CLEANUP':
      state.timeoutIds.forEach(clearTimeout);
      return { ...state, timeoutIds: [], isProcessing: false };
    default:
      return state;
  }
}

export function OAuthHandler() {
  const router = useRouter();
  const { push } = router;
  const hasProcessedOAuth = useRef(false);
  const [_state, dispatch] = useReducer(oauthReducer, {
    isProcessing: false,
    timeoutIds: [],
  });

  const addTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    dispatch({ type: 'ADD_TIMEOUT', id });
  }, []);

  const handleOAuth = useCallback(() => {
    if (hasProcessedOAuth.current) return;
    hasProcessedOAuth.current = true;
    dispatch({ type: 'START' });

    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const welcome = urlParams.get('welcome');
    const provider = urlParams.get('provider');
    const authParam = urlParams.get('auth');
    const originApp: OriginApp = detectOriginApp();

    if (!oauthSuccess && !welcome) return;

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
        addTimeout(() => push('/login'), 1000);
        return;
      }

      interface OAuthUser {
        id: string;
        email: string;
        first_name?: string;
        last_name?: string;
        name?: string;
        avatar_url?: string;
        avatarUrl?: string;
        picture?: string;
        role?: { name: string } | string;
        roleName?: string;
        [key: string]: unknown;
      }

      interface OAuthPayload {
        accessToken?: string;
        token?: string;
        user?: OAuthUser;
      }

      let decodedObj: OAuthPayload;
      try {
        decodedObj = JSON.parse(decodedJson);
      } catch {
        toast.error('Error processing OAuth callback. Please try again.', { duration: 4000 });
        addTimeout(() => push('/login'), 1000);
        return;
      }

      const accessToken = decodedObj.accessToken || decodedObj.token;
      const authData = decodedObj.user ? { ...decodedObj, user: decodedObj.user } : null;

      if (accessToken && authData && authData.user?.id && authData.user?.email) {
        const userRole =
          (typeof authData.user?.role === 'object' ? authData.user?.role?.name : authData.user?.role) ||
          authData.user?.roleName;
        const normalizedRole = (userRole || '').toUpperCase();

        const redirectParam = sessionStorage.getItem('oauth_redirect');

        // If the role cannot access this app, redirect to the correct app
        if (!canAccessApp(normalizedRole, originApp)) {
          const redirectUrl = getRedirectUrlForRole(normalizedRole, originApp, redirectParam);
          addTimeout(() => {
            window.location.href = redirectUrl;
          }, 1500);
          return;
        }

        // Exchange the OAuth token for an httpOnly cookie
        fetch('/api/auth/admin-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: accessToken }),
        }).then((response) => {
          if (!response.ok) {
            toast.error('Error setting up session. Please try again.', { duration: 4000 });
            addTimeout(() => push('/login'), 1000);
            return;
          }

          addTimeout(() => {
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
          }, 200);
        }).catch(() => {
          toast.error('Error setting up session. Please try again.', { duration: 4000 });
          addTimeout(() => push('/login'), 1000);
        });
        return;
      }
    }

    // Fallback: check session via cookie
    addTimeout(() => {
      fetch('/auth-session', { credentials: 'include' })
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
    }, 100);
  }, [addTimeout, push]);

  useEffect(() => {
    handleOAuth();
    return () => {
      dispatch({ type: 'CLEANUP' });
    };
  }, [handleOAuth]);

  return null;
}
