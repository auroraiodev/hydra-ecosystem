import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import InventarioContent from './inventario-content';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Inventario | Hydra Admin',
};

export default function InventarioPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      }
    >
      <InventarioContent />
    </Suspense>
  );
}
