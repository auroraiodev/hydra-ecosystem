import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileContent from './profile-content';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Skeleton className="size-20 sm:h-24 sm:w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
