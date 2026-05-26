import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoriesSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {['sk1', 'sk2', 'sk3', 'sk4', 'sk5'].map((id) => (
        <div key={id} className="flex items-center gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}
