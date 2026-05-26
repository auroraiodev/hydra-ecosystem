'use client';

import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';
import { useId } from 'react';

interface CardSkeletonProps {
  count?: number;
  className?: string;
  variant?: 'default' | 'grid' | 'singles' | 'vault' | 'wishlist';
}

export function CardSkeleton({
  count = 1,
  className = '',
  variant = 'default',
}: CardSkeletonProps) {
  const baseId = useId();
  const skeletons = Array.from({ length: count }, (_, i) => ({ uid: `${baseId}-skel-${i}` }));

  const renderSingleSkeleton = (item: { uid: string }) => {
    if (variant === 'wishlist') {
      return (
        <div
          key={`${item.uid}-wishlist`}
          className={cn(
            'bg-vault-surface rounded-2xl border border-white/5 overflow-hidden p-4 flex gap-4 animate-pulse',
            className
          )}
        >
          {/* Product Image Skeleton */}
          <div className="relative w-20 aspect-[3/4] bg-white/5 rounded-xl overflow-hidden flex-shrink-0">
            <Skeleton className="size-full" />
          </div>

          {/* Product Details Skeleton */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-2/3 rounded" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-1/3 rounded" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
            <div className="flex items-center justify-between mt-auto">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={`${item.uid}-default`}
        className={cn(
          'vault-glass-card rounded-xl overflow-hidden flex flex-col h-full animate-pulse',
          className
        )}
      >
        {/* Image Area */}
        <div className="aspect-square relative p-1 bg-white/5">
          <Skeleton className="size-full rounded-lg" />
        </div>

        {/* Content Area */}
        <div className="p-4 flex flex-col gap-3 grow">
          {/* Title */}
          <div className="gap-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          {/* Subtitle / Expansion */}
          <Skeleton className="h-3 w-1/3" />

          {/* Tags / Badges */}
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>

          {/* Price */}
          <div className="mt-auto pt-2">
            <Skeleton className="h-7 w-24" />
          </div>

          {/* Button */}
          <Skeleton className="h-9 w-full rounded-lg mt-2" />
        </div>
      </div>
    );
  };

  if (count > 1) {
    return <>{skeletons.map((item) => renderSingleSkeleton(item))}</>;
  }

  return renderSingleSkeleton({ uid: `${baseId}-skel-0` });
}
