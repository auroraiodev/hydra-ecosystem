import { Suspense } from 'react';
import SettingsContent from './settings-content';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="space-y-4 max-w-3xl">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
