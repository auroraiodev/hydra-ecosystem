import * as React from 'react';
import { cn } from '../../utils/cn';
import { Label } from '../Label';

const FormItem = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) => (
  <div ref={ref} className={cn('space-y-2', className)} {...props} />
);

const FormLabel = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof Label> & { ref?: React.Ref<HTMLLabelElement> }) => (
  <Label ref={ref} className={cn(className)} {...props} />
);

const FormControl = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) => (
  <div ref={ref} className={cn(className)} {...props} />
);

const FormDescription = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) => (
  <p ref={ref} className={cn('text-sm text-text-muted', className)} {...props} />
);

const FormMessage = ({
  className,
  children,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) => {
  if (!children) return null;
  return (
    <p ref={ref} className={cn('text-sm font-medium text-red-500', className)} {...props}>
      {children}
    </p>
  );
};

export { FormItem, FormLabel, FormControl, FormDescription, FormMessage };
