'use client';

import * as React from 'react';
import {
  Spinner as FluentSpinner,
  type SpinnerProps as FluentSpinnerProps,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';

interface SpinnerProps extends FluentSpinnerProps {
  className?: string;
}

export function Spinner({ className, size = 'medium', ...props }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <FluentSpinner size={size} {...props} />
    </div>
  );
}
