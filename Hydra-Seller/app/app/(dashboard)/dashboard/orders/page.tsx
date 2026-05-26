import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { OrdersContent } from './orders-content';

export const dynamic = 'force-dynamic';

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-9 w-full sm:w-72" />
            <Skeleton className="h-9 w-full sm:w-44" />
            <Skeleton className="h-9 w-full sm:w-36" />
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 pb-4 space-y-1">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="p-6 pt-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b last:border-b-0">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-4 w-24 hidden sm:block" />
                  <Skeleton className="h-4 w-20 hidden md:block" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="size-8 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
