import { Skeleton } from '@/features/shared/ui/skeleton';

export function CartSkeleton() {
  return (
    <div className="dark bg-vault-bg font-display text-vault-text min-h-screen antialiased relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 right-0 size-[800px] bg-teal/5 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute top-[20%] left-0 size-[600px] bg-teal/3 rounded-full blur-[120px] -translate-x-1/3 pointer-events-none z-0" />

      {/* Mobile Layout Skeleton */}
      <div className="lg:hidden pb-72 relative z-10">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-20 bg-vault-bg/95 backdrop-blur-xl border-b border-vault-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div>
                  <Skeleton className="h-5 w-20 rounded mb-1" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-14 rounded" />
            </div>
          </div>
        </div>

        {/* Cart Items Skeleton */}
        <div className="p-4 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={`cart-mob-skel-${i}`}
              className="bg-vault-surface border border-vault-border rounded-2xl p-4 flex gap-3"
            >
              <Skeleton className="w-20 h-24 rounded-xl flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
                <div className="flex items-center justify-between mt-auto">
                  <Skeleton className="h-5 w-20 rounded" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Layout Skeleton */}
      <div className="hidden lg:block max-w-6xl mx-auto px-6 py-10 relative z-10">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-xl" />
            <div>
              <Skeleton className="h-7 w-48 rounded-lg mb-2" />
              <Skeleton className="h-4 w-56 rounded" />
            </div>
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Cart Items Skeleton */}
          <div className="col-span-2 flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={`cart-desk-skel-${i}`}
                className="bg-vault-surface border border-vault-border rounded-2xl p-4 flex gap-4"
              >
                <Skeleton className="w-24 h-32 rounded-xl flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <div className="flex gap-2 mt-1">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <Skeleton className="h-6 w-24 rounded" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-24 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Skeleton */}
          <div className="col-span-1">
            <div className="bg-vault-surface border border-vault-border rounded-2xl p-6 flex flex-col gap-4">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <Skeleton className="h-px w-full my-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-xl mt-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
