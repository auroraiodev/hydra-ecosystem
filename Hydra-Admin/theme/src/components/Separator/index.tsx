import * as React from 'react';
import { cn } from '../../utils/cn';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

/**
 * Thin divider line — horizontal by default.
 */
export const Separator = ({
  className,
  orientation = 'horizontal',
  decorative = true,
  ref,
  ...props
}: SeparatorProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    role={decorative ? 'none' : 'separator'}
    aria-orientation={decorative ? undefined : orientation}
    className={cn(
      'shrink-0 bg-border-subtle',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className
    )}
    {...props}
  />
);
