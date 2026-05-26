import { Suspense } from 'react';
import { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import CategoriesContent from './categories-content';

export const metadata: Metadata = {
  title: 'Categorías | Hydra Admin',
};

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-32" />
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b last:border-b-0">
                <Skeleton className="h-4 w-40 flex-1" />
                <Skeleton className="h-4 w-24 hidden sm:block" />
                <Skeleton className="h-4 w-20 hidden md:block" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
