'use client';

import * as React from 'react';
import {
  Label as FluentLabel,
  type LabelProps as FluentLabelProps,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';

function Label({
  className,
  ref,
  ...props
}: FluentLabelProps & { ref?: React.Ref<HTMLLabelElement> }) {
  return (
    <FluentLabel
      ref={ref as React.Ref<HTMLLabelElement>}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
}
Label.displayName = 'Label';

export { Label };
