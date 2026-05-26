import { Skeleton } from '@/features/shared/ui/skeleton';

export function OrdersSkeleton() {
  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl mb-6" />
          <div className="flex flex-col gap-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={`order-skel-mob-${i}`}
                className="glass-panel ghost-border rounded-2xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-32 rounded mt-1" />
                    </div>
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((j) => (
                      <Skeleton
                        key={`order-img-mob-${i}-${j}`}
                        className="w-12 h-16 rounded-md"
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-white/[0.03] px-4 py-2 h-8 border-t border-white/5" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="max-w-5xl mx-auto py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Skeleton className="size-10 rounded-full" />
              <div>
                <Skeleton className="h-8 w-40 rounded-lg mb-2" />
                <Skeleton className="h-4 w-56 rounded" />
              </div>
            </div>
            <Skeleton className="h-10 w-80 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`order-skel-desk-${i}`}
                className="glass-panel ghost-border rounded-2xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-36 rounded mt-1" />
                    </div>
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((j) => (
                      <Skeleton
                        key={`order-img-desk-${i}-${j}`}
                        className="w-12 h-16 rounded-md"
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-white/[0.03] px-4 py-2 h-8 border-t border-white/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
