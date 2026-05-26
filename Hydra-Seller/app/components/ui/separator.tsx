'use client';

import * as React from 'react';
import {
  Divider as FluentDivider,
  type DividerProps as FluentDividerProps,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';

function Separator({
  className,
  vertical,
  ref,
  ...props
}: FluentDividerProps & { ref?: React.Ref<HTMLDivElement> }) {
  return <FluentDivider ref={ref} vertical={vertical} className={cn(className)} {...props} />;
}
Separator.displayName = 'Separator';

export { Separator };
