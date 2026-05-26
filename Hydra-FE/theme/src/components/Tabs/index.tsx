'use client';
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva('inline-flex items-center justify-center rounded-xl p-1', {
  variants: {
    variant: {
      default: 'bg-surface-low text-text-muted',
      outline: 'border border-border-subtle bg-transparent',
      ghost:   'gap-1 bg-transparent',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = ({
  className,
  variant,
  ref,
  ...props
}: TabsListProps & { ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.List>> }) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
);

const TabsTrigger = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Trigger>>;
}) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-surface data-[state=active]:text-text-body data-[state=active]:shadow-sm',
      'data-[state=inactive]:text-text-muted hover:data-[state=inactive]:text-text-body',
      className
    )}
    {...props}
  />
);

const TabsContent = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Content>>;
}) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
);

export { Tabs, TabsList, TabsTrigger, TabsContent };
