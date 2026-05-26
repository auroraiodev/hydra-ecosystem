'use client';

import * as React from 'react';
import {
  Popover as FluentPopover,
  PopoverTrigger as FluentPopoverTrigger,
  PopoverSurface,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';

const Popover = FluentPopover;

const PopoverTrigger = FluentPopoverTrigger;

function PopoverContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <PopoverSurface
      className={cn(
        'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md',
        className
      )}
    >
      {children}
    </PopoverSurface>
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
};
