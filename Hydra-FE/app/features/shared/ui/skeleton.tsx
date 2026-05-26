'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  vault?: boolean;
  variant?: 'default' | 'vault';
}

function Skeleton({ className = '', vault = false, variant = 'vault', ...props }: SkeletonProps) {
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

export { Skeleton };
