import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductsContent } from './products-content';

export const dynamic = 'force-dynamic';

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-9 w-full sm:w-64" />
            <Skeleton className="h-9 w-full sm:w-36" />
            <Skeleton className="h-9 w-full sm:w-36" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden"
              >
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
