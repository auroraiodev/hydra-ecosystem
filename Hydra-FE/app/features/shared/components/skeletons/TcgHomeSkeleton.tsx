import { Skeleton } from '@/features/shared/ui/skeleton';
import { CardSkeleton } from '@/features/shared/ui/CardSkeleton';

export function TcgHomeSkeleton() {
  return (
    <div className="font-display min-h-screen pb-24 lg:pb-12 antialiased relative overflow-hidden bg-vault-bg text-white">
      {/* Background glows */}
      <div className="absolute top-0 right-0 size-[900px] bg-teal/5 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute top-[15%] left-0 size-[700px] bg-teal/3 rounded-full blur-[120px] -translate-x-1/3 pointer-events-none z-0" />

      <div className="flex flex-col gap-4 lg:gap-6 pt-4 lg:pt-6 lg:max-w-7xl lg:mx-auto lg:px-4 lg:sm:px-6 relative z-10">
        {/* Breadcrumb Skeleton */}
        <div className="px-4 lg:px-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </div>

        {/* Category Tabs Skeleton */}
        <div className="px-4 lg:px-0">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={`tab-skel-${i}`}
                className="h-9 w-20 rounded-lg"
                vault
              />
            ))}
          </div>
        </div>

        {/* Hero Carousel Skeleton */}
        <div className="px-4 lg:px-0">
          <Skeleton vault className="h-48 lg:h-64 w-full rounded-2xl" />
        </div>

        {/* Search Input Skeleton */}
        <div className="px-4 lg:px-0">
          <div className="lg:max-w-4xl lg:mx-auto">
            <Skeleton vault className="h-14 w-full rounded-xl" />
          </div>
        </div>

        {/* Product Sections Skeleton */}
        <div className="px-4 lg:px-0 py-8 lg:py-12">
          {/* Section title */}
          <div className="flex items-center gap-3 mb-8">
            <Skeleton className="h-8 w-1.5 rounded-full" vault />
            <Skeleton className="h-7 w-48 rounded-lg" vault />
          </div>
          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            <CardSkeleton count={8} variant="vault" />
          </div>
        </div>

        {/* Seller CTA Skeleton */}
        <Skeleton vault className="h-32 w-full rounded-2xl" />

        {/* SEO Content Skeleton */}
        <div className="px-4 lg:px-0 py-8">
          <Skeleton className="h-6 w-64 rounded-lg mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={`seo-skel-${i}`} className="flex flex-col gap-3">
                <Skeleton vault className="h-4 w-3/4 rounded" />
                <Skeleton vault className="h-3 w-full rounded" />
                <Skeleton vault className="h-3 w-5/6 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
