import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayoutWrapper from './dashboard-layout-wrapper';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="h-16 border-b bg-background w-full" />
          <div className="p-4 sm:p-8 space-y-4 max-w-6xl mx-auto">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      }
    >
      <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
    </Suspense>
  );
}
