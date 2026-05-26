'use client';
import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const progressIndicatorVariants = cva('h-full w-full flex-1 transition-all duration-300', {
  variants: {
    variant: {
      default: 'bg-primary',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger:  'bg-red-500',
      gold:    'bg-gold',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressIndicatorVariants> {
  ref?: React.Ref<React.ElementRef<typeof ProgressPrimitive.Root>>;
}

const Progress = ({
  className,
  value,
  variant,
  ref,
  ...props
}: ProgressProps) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-surface-low', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(progressIndicatorVariants({ variant }))}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
);

export { Progress };
