'use client';

import * as React from 'react';
import {
  Skeleton as FluentSkeleton,
  SkeletonItem,
  type SkeletonProps,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <FluentSkeleton {...props}>
      <SkeletonItem className={cn(className)} />
    </FluentSkeleton>
  );
}

export { Skeleton };
