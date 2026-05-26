import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function TagsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="p-6 border rounded-lg">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-2">
          {['sk1', 'sk2', 'sk3', 'sk4', 'sk5'].map((k) => (
            <div key={k} className="flex items-center justify-between p-3 border rounded">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
