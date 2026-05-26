import * as React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use Vault (dark glassmorphism) shimmer instead of the default light shimmer */
  vault?: boolean;
  variant?: 'default' | 'vault';
}

export function Skeleton({ className = '', vault = false, variant = 'vault', ...props }: SkeletonProps) {
  const isVault = vault || variant === 'vault';
  return (
    <div
      className={cn(
        'rounded-md transition-colors',
        isVault ? 'vault-skeleton-shimmer' : 'skeleton-shimmer',
        className
      )}
      {...props}
    />
  );
}

/* ── CardSkeleton ── */

export interface CardSkeletonProps {
  count?: number;
  className?: string;
  variant?: 'default' | 'grid' | 'singles' | 'vault' | 'wishlist';
}

export function CardSkeleton({ count = 1, className = '', variant = 'default' }: CardSkeletonProps) {
  const skeletonItems = Array.from({ length: count }, (_, i) => ({
    id: `${variant}-${count}-${i}`,
    index: i
  }));

  const renderWishlist = ({ id }: { id: string; index: number }) => (
    <div
      key={`wishlist-${id}`}
      className={cn(
        'bg-vault-surface rounded-2xl border border-white/5 overflow-hidden p-4 flex gap-4 animate-pulse',
        className
      )}
    >
      <div className="relative w-20 aspect-[3/4] bg-white/5 rounded-xl overflow-hidden flex-shrink-0">
        <Skeleton className="size-full" />
      </div>
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

  const renderDefault = ({ id }: { id: string; index: number }) => (
    <div
      key={`default-${id}`}
      className={cn(
        'vault-glass-card rounded-xl overflow-hidden flex flex-col h-full animate-pulse',
        className
      )}
    >
      <div className="aspect-square relative p-1 bg-white/5">
        <Skeleton className="size-full rounded-lg" />
      </div>
      <div className="p-4 flex flex-col gap-3 grow">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="mt-auto pt-2">
          <Skeleton className="h-7 w-24" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg mt-2" />
      </div>
    </div>
  );

  const renderOne = (item: { id: string; index: number }) =>
    variant === 'wishlist' ? renderWishlist(item) : renderDefault(item);

  if (count > 1) return <>{skeletonItems.map((item) => renderOne(item))}</>;
  return renderOne(skeletonItems[0]);
}
