import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import UsersContent from './users-content';

export const dynamic = 'force-dynamic';

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-4 w-52" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-9 w-full sm:w-72" />
            <Skeleton className="h-9 w-full sm:w-40" />
            <Skeleton className="h-9 w-full sm:w-36" />
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 pb-4 space-y-1">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="p-6 pt-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b last:border-b-0">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-1 min-w-0">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-4 w-20 hidden sm:block" />
                  <Skeleton className="h-6 w-24 rounded-full hidden md:block" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="size-8 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
