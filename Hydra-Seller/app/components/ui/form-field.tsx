'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

function FormItem({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn('space-y-2', className)} {...props} />;
}
FormItem.displayName = 'FormItem';

function FormLabel({
  className,
  ref,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { ref?: React.Ref<HTMLLabelElement> }) {
  return (
    <Label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
}
FormLabel.displayName = 'FormLabel';

function FormControl({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn(className)} {...props} />;
}
FormControl.displayName = 'FormControl';

function FormMessage({
  className,
  children,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) {
  if (!children) {
    return null;
  }

  return (
    <p ref={ref} className={cn('text-sm font-medium text-destructive', className)} {...props}>
      {children}
    </p>
  );
}
FormMessage.displayName = 'FormMessage';

export { FormItem, FormLabel, FormControl, FormMessage };
