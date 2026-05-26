import { useCallback, useTransition } from 'react';
import { useToastContext } from '@/features/shared/components/ToastProvider';

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3004';

export function useGoogleAuth() {
  const [isPending, startTransition] = useTransition();
  const { error: showError } = useToastContext();

  const initiateGoogleAuth = useCallback(async () => {
    if (isPending) return;

    startTransition(async () => {
      try {
        const pendingRedirect = new URLSearchParams(window.location.search).get('redirect');

        if (pendingRedirect) {
          sessionStorage.setItem('oauth_redirect', pendingRedirect);
        }

        const authUrl = new URL(`${AUTH_SERVICE_URL}/auth/google`);
        authUrl.searchParams.set('redirect_to', `${window.location.origin}/auth/callback`);
        window.location.href = authUrl.toString();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error al iniciar la autenticación con Google';
        showError(errorMessage);
      }
    });
  }, [isPending, showError]);

  return {
    initiateGoogleAuth,
    isLoading: isPending,
  };
}
