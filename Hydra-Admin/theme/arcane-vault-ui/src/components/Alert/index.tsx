import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export const alertVariants = cva(
  'border px-4 py-3 rounded-xl text-sm font-medium',
  {
    variants: {
      type: {
        error:   'bg-red-50   border-red-200   text-red-700',
        success: 'bg-green-50 border-green-200 text-green-700',
        info:    'bg-blue-50  border-blue-200  text-blue-700',
        warning: 'bg-amber-50 border-amber-200 text-amber-700',
        vault:   'bg-teal/10  border-teal/20   text-white/90 backdrop-blur-md',
      },
    },
    defaultVariants: {
      type: 'error',
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  message?: string;
}

export function Alert({ message, type, className, children, ...props }: AlertProps) {
  return (
    <div className={cn(alertVariants({ type }), className)} {...props}>
      {message ?? children}
    </div>
  );
}
