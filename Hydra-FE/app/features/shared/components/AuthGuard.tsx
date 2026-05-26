'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { Skeleton } from '@/features/shared/ui/skeleton';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { push } = useRouter();
  const pathname = usePathname();

  // Auth guard: redirect to login if not authenticated (guard component by design)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectPath = encodeURIComponent(pathname);
      push(`/login?redirect=${redirectPath}`);
    }
  }, [isLoading, isAuthenticated, push, pathname]);

  // Loading or Unauthenticated state: Show skeletons to prevent content flashing
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col gap-8 p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
        <div className="flex items-center gap-6">
          <Skeleton className="size-32 rounded-full border-4 border-surface shadow-xl" />
          <div className="gap-y-4">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-6 w-32 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>

        <div className="gap-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
