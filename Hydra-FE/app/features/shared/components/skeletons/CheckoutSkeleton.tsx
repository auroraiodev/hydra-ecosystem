import { Skeleton } from '@/features/shared/ui/skeleton';

export function CheckoutSkeleton() {
  return (
    <div className="dark bg-vault-bg font-display text-vault-text min-h-screen antialiased relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 right-0 size-[800px] bg-teal/5 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />

      {/* Mobile Layout Skeleton */}
      <div className="lg:hidden flex flex-col relative overflow-hidden">
        {/* Step Indicator Skeleton */}
        <div className="bg-vault-bg/95 backdrop-blur-xl border-b border-vault-border p-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={`step-mob-${i}`} className="h-1.5 flex-1 rounded-full" />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 mt-2">
          <Skeleton className="size-10 rounded-xl" />
        </div>

        <div className="flex-1 px-4 py-6 flex flex-col gap-4">
          {/* Contact Section Skeleton */}
          <div className="bg-vault-surface rounded-2xl border border-vault-border p-4 flex flex-col gap-3">
            <Skeleton className="h-5 w-32 rounded mb-1" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-12 w-full rounded-xl mt-1" />
          </div>

          {/* Order Summary Skeleton */}
          <div className="bg-vault-surface rounded-2xl border border-vault-border p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={`checkout-item-mob-${i}`} className="flex justify-between">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-vault-bg/95 backdrop-blur-xl border-t border-vault-border p-4">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* Desktop Layout Skeleton */}
      <div className="hidden lg:block max-w-6xl mx-auto px-6 py-10 relative z-10">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="size-10 rounded-xl" />
          <div>
            <Skeleton className="h-7 w-48 rounded-lg mb-1" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Left Column Skeleton */}
          <div className="col-span-2 flex flex-col gap-6">
            {/* Contact Section */}
            <div className="bg-vault-surface rounded-2xl border border-vault-border p-6 flex flex-col gap-4">
              <Skeleton className="h-6 w-40 rounded-lg mb-1" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            {/* Shipping Section */}
            <div className="bg-vault-surface rounded-2xl border border-vault-border p-6 flex flex-col gap-4">
              <Skeleton className="h-6 w-48 rounded-lg mb-1" />
              <div className="flex gap-4">
                <Skeleton className="h-16 flex-1 rounded-xl" />
                <Skeleton className="h-16 flex-1 rounded-xl" />
              </div>
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>

            {/* Payment Section */}
            <div className="bg-vault-surface rounded-2xl border border-vault-border p-6 flex flex-col gap-4">
              <Skeleton className="h-6 w-44 rounded-lg mb-1" />
              <div className="flex gap-4">
                <Skeleton className="h-16 flex-1 rounded-xl" />
                <Skeleton className="h-16 flex-1 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="col-span-1">
            <div className="bg-vault-surface border border-vault-border rounded-2xl p-6 flex flex-col gap-4 sticky top-4">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={`checkout-sum-desk-${i}`} className="flex justify-between">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                ))}
                <Skeleton className="h-px w-full my-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20 rounded" />
                  <Skeleton className="h-5 w-24 rounded" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-xl mt-2" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
