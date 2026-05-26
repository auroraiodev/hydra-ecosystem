import { Skeleton } from '@/features/shared/ui/skeleton';

export function HomeSkeleton() {
  return (
    <div className="animate-page-enter">
      {/* Hero Section Skeleton */}
      <div className="relative w-full h-[60vh] lg:h-[70vh] bg-vault-bg overflow-hidden">
        <Skeleton vault className="absolute inset-0" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <Skeleton className="h-8 w-3/4 max-w-xl rounded-lg" />
          <Skeleton className="h-12 w-1/2 max-w-md rounded-xl" />
        </div>
      </div>

      {/* Hero Carousel Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-12 relative z-20">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={`hero-skel-${i}`}
              vault
              className="h-40 w-72 rounded-2xl flex-shrink-0"
            />
          ))}
        </div>
      </div>

      {/* FAQ Section Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <Skeleton className="h-8 w-48 rounded-lg mb-6" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={`faq-skel-${i}`}
              vault
              className="h-16 w-full rounded-xl"
            />
          ))}
        </div>
      </div>

      {/* SEO Content Skeleton */}
      <div className="bg-vault-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-6 w-64 rounded-lg mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={`seo-skel-${i}`} className="flex flex-col gap-3">
                <Skeleton vault className="h-4 w-3/4 rounded" />
                <Skeleton vault className="h-3 w-full rounded" />
                <Skeleton vault className="h-3 w-5/6 rounded" />
                <Skeleton vault className="h-3 w-4/6 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
