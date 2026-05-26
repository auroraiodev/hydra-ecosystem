import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-transparent shrink-0',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12 border-[3px]',
      },
      variant: {
        default: 'border-t-primary border-r-primary',
        white:   'border-t-white border-r-white',
        muted:   'border-t-text-muted border-r-text-muted',
      },
    },
    defaultVariants: { size: 'md', variant: 'default' },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

export function Spinner({ className, size, variant, label, ...props }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)} {...props}>
      <div className={spinnerVariants({ size, variant })} aria-hidden="true" />
      {label && <span className="text-sm text-text-muted">{label}</span>}
      <span className="sr-only">{label ?? 'Loading...'}</span>
    </div>
  );
}
