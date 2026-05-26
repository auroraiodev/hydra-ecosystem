'use client';
import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '../../utils/cn';
import { buttonVariants } from '../Button';

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> & {
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Overlay>>;
}) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 backdrop-blur-md',
      'transition-opacity duration-200 data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
      className
    )}
    {...props}
  />
);

const AlertDialogContent = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Content>>;
}) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          'pointer-events-auto w-full max-w-md bg-surface border border-border-subtle rounded-2xl p-6 shadow-2xl',
          'transition-all duration-200 data-[state=open]:opacity-100 data-[state=open]:scale-100',
          'data-[state=closed]:opacity-0 data-[state=closed]:scale-95',
          className
        )}
        {...props}
      />
    </div>
  </AlertDialogPortal>
);

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 mb-4', className)} {...props} />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-6', className)} {...props} />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogTitle = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> & {
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Title>>;
}) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-text-body', className)}
    {...props}
  />
);

const AlertDialogDescription = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description> & {
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Description>>;
}) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-text-muted', className)}
    {...props}
  />
);

const AlertDialogAction = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & {
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Action>>;
}) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants({ variant: 'default' }), className)}
    {...props}
  />
);

const AlertDialogCancel = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> & {
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Cancel>>;
}) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: 'outline' }), className)}
    {...props}
  />
);

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
