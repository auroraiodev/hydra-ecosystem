'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  [key: string]: unknown;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { credentials: 'include' });
      
      if (!response.ok) {
        setUser(null);
        setIsLoading(false);
        router.push('/login');
        return;
      }

      const data = await response.json();
      
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        router.push('/login');
      }
    } catch {
      setUser(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const setSession = useCallback(async (userData: User) => {
    setUser(userData);
    await checkSession();
  }, [checkSession]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/admin-logout', { method: 'POST', credentials: 'include' });
    } catch {
      // best-effort
    }
    setUser(null);
    router.push('/login');
  }, [router]);

  return { user, isLoading, logout, setSession, checkSession };
}
