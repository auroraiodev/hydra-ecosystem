'use client';
import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../../utils/cn';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = ({
  className,
  align = 'center',
  sideOffset = 4,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof PopoverPrimitive.Content>>;
}) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-72 rounded-xl border border-border-subtle bg-surface p-4 text-text-body shadow-xl',
        'transition-all duration-150 data-[state=open]:opacity-100 data-[state=open]:scale-100',
        'data-[state=closed]:opacity-0 data-[state=closed]:scale-95',
        'data-[side=bottom]:origin-top data-[side=top]:origin-bottom',
        'data-[side=left]:origin-right data-[side=right]:origin-left',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
);

const PopoverHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1 mb-2', className)} {...props} />
);

const PopoverTitle = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-sm font-semibold text-text-body', className)} {...props} />
);

const PopoverDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-text-muted', className)} {...props} />
);

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
};
