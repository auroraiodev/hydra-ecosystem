import { Skeleton } from '@/features/shared/ui/skeleton';
import { CardSkeleton } from '@/features/shared/ui/CardSkeleton';

export function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-vault-bg text-white antialiased relative overflow-hidden font-display pb-24 lg:pb-0">
      {/* Background glows */}
      <div className="absolute top-0 right-0 size-[900px] bg-teal/5 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />

      <main className="container mx-auto px-4 py-6 lg:py-8 relative z-10">
        {/* Search Input Skeleton */}
        <div className="mb-8 lg:mb-10 max-w-4xl mx-auto">
          <Skeleton vault className="h-14 w-full rounded-xl" />
        </div>

        {/* Results Title Skeleton */}
        <div className="mb-6 lg:mb-8">
          <Skeleton className="h-7 w-48 rounded-lg mb-2" vault />
          <Skeleton className="h-4 w-32 rounded" vault />
        </div>

        {/* Mobile Grid */}
        <div className="lg:hidden">
          <div className="grid grid-cols-2 gap-4">
            <CardSkeleton count={8} variant="vault" />
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <CardSkeleton count={12} variant="vault" />
          </div>
        </div>
      </main>
    </div>
  );
}
