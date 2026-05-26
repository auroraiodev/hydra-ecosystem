import { Skeleton } from '@/features/shared/ui/skeleton';
import { CardSkeleton } from '@/features/shared/ui/CardSkeleton';

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-vault-bg text-white antialiased relative overflow-hidden font-display pb-24 lg:pb-0 -mt-14 pt-14">
      {/* Background glows */}
      <div className="absolute top-0 right-0 size-[900px] bg-teal/5 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute top-[15%] left-0 size-[700px] bg-teal/3 rounded-full blur-[120px] -translate-x-1/3 pointer-events-none z-0" />

      <main className="flex-grow container mx-auto px-4 py-8 lg:py-12 relative z-10">
        {/* Breadcrumb Skeleton */}
        <div className="flex mb-8 items-center gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>

        {/* Product Card Skeleton */}
        <div className="vault-glass-card rounded-2xl overflow-hidden border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
            {/* Image Area */}
            <div className="bg-white/5 p-8 flex flex-col items-center justify-center relative">
              <Skeleton
                className="w-full max-w-lg aspect-[3/4] shadow-xl rounded-xl mb-4"
                vault
              />
            </div>

            {/* Info Area */}
            <div className="p-6 lg:p-10 flex flex-col">
              <div className="flex-grow gap-y-6">
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Skeleton className="h-6 w-24" vault />
                    <Skeleton className="h-6 w-16" vault />
                  </div>
                  <Skeleton className="h-8 lg:h-10 w-3/4 mb-3" vault />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <Skeleton className="h-20 rounded-lg border border-white/5" vault />
                  <Skeleton className="h-20 rounded-lg border border-white/5" vault />
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-full" vault />
                  <Skeleton className="h-4 w-5/6" vault />
                  <Skeleton className="h-4 w-4/6" vault />
                </div>
                <div className="mt-8 flex gap-3">
                  <Skeleton className="h-12 w-32 rounded-xl" vault />
                  <Skeleton className="h-12 w-12 rounded-xl" vault />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-20">
          <div className="flex items-center gap-4 mb-10">
            <Skeleton className="h-8 w-1.5 rounded-full" vault />
            <Skeleton className="h-7 w-56 rounded-lg" vault />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <CardSkeleton count={4} variant="vault" />
          </div>
        </div>
      </main>
    </div>
  );
}
