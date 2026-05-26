'use client';

import * as React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogTrigger,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const AlertDialog = Dialog;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AlertDialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AlertDialogOverlay = () => null;

function AlertDialogContent({
  className,
  children,
  ref,
}: {
  className?: string;
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return (
    <DialogSurface ref={ref} className={cn('bg-background border', className)}>
      <DialogBody>{children}</DialogBody>
    </DialogSurface>
  );
}
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-2 text-center sm:text-left mb-4', className)}
    {...props}
  />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <DialogActions
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

function AlertDialogTitle({
  className,
  ref,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return <DialogTitle ref={ref} className={cn('text-lg font-semibold', className)} {...props} />;
}
AlertDialogTitle.displayName = 'AlertDialogTitle';

function AlertDialogDescription({
  className,
  ref,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
AlertDialogDescription.displayName = 'AlertDialogDescription';

function AlertDialogAction({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof Button> & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <DialogTrigger action="close">
      <Button ref={ref} variant="default" className={cn(className)} {...props} />
    </DialogTrigger>
  );
}
AlertDialogAction.displayName = 'AlertDialogAction';

function AlertDialogCancel({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof Button> & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <DialogTrigger action="close">
      <Button ref={ref} variant="outline" className={cn('mt-2 sm:mt-0', className)} {...props} />
    </DialogTrigger>
  );
}
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
