'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export default function ProfileRedirect() {
  const { push } = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' });
        if (!response.ok) {
          push('/login');
          return;
        }
        push('/dashboard/profile');
      } catch {
        push('/login');
      }
    };

    checkAuth();
  }, [push]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="large" />
        <p className="text-sm text-muted-foreground">Redirigiendo…</p>
      </div>
    </div>
  );
}
