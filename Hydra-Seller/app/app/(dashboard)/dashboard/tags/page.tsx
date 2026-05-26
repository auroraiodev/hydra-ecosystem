import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import TagsContent from './tags-content';

export const dynamic = 'force-dynamic';

export default function TagsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-full" />
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b last:border-b-0">
                <Skeleton className="h-4 w-32 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <TagsContent />
    </Suspense>
  );
}
