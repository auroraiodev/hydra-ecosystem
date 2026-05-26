'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { canAccessApp, detectOriginApp, getRedirectUrlForRole } from '@/lib/auth-redirect';

function DashboardLayoutWrapperInner({ children }: { children: React.ReactNode }) {
  const { push } = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' });
        
        if (!response.ok) {
          push('/login');
          return;
        }

        const data = await response.json();
        
        if (!data.authenticated) {
          push('/login');
          return;
        }

        const userRole = data.user?.role?.toUpperCase() || '';
        const originApp = detectOriginApp();

        if (!canAccessApp(userRole, originApp)) {
          window.location.href = getRedirectUrlForRole(userRole, originApp);
          return;
        }

        setIsLoading(false);
      } catch {
        push('/login');
      }
    };

    checkAuth();
  }, [push]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b bg-background w-full" />
        <div className="p-4 sm:p-8 space-y-4 max-w-6xl mx-auto">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-96 w-full bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 lg:pt-0 lg:ml-64">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutWrapperInner>{children}</DashboardLayoutWrapperInner>;
}
