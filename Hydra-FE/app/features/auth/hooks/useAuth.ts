import { useCallback } from 'react';
import { useAppDispatch, useAppSelector, type RootState } from '@/lib/store';
import { setCredentials, logout as logoutAction } from '@/lib/store';
import { api } from '@/lib/api/client';
import type { LoginRequest, LoginResponse } from '@/lib/types';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isLoading } = useAppSelector(
    (state: RootState) => state.auth
  );

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const data = (await api.login(credentials.email, credentials.password)) as {
        user?: LoginResponse['user'];
        token?: string;
        success?: boolean;
        data?: {
          user?: LoginResponse['user'];
          accessToken?: string;
          token?: string;
          refreshToken?: string;
        };
        refreshToken?: string;
      };

      let user = data.user;
      let token = data.token;

      if (data.success && data.data) {
        user = data.data.user;
        token = data.data.accessToken || data.data.token;
      }

      if (!user || !token) throw new Error('Invalid login response: missing user or token');
      dispatch(setCredentials({ user, token }));

      // The httpOnly __sid cookie was already set by the /api/auth/login
      // Next.js route — no client-side document.cookie call needed.

      return data;
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    // Clear Redux state
    dispatch(logoutAction());

    // Clear user profile from localStorage and clear httpOnly cookie server-side
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user:v1');
    }

    // Clear the httpOnly __sid cookie
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

    // Full page reload: the cartManager singleton is re-initialised by the
    // module evaluator on the new page, so no explicit reset is needed here.
    // (Importing cartManager from useCart would create a circular dependency.)
    window.location.href = '/login';
  }, [dispatch]);

  const setCredentialsFromOAuth = useCallback(
    (user: LoginResponse['user'], token: string) => {
      dispatch(setCredentials({ user, token }));
    },
    [dispatch]
  );

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setCredentials: setCredentialsFromOAuth,
  };
}
