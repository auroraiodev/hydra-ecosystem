'use client';

import * as React from 'react';
import {
  Dialog as FluentDialog,
  DialogSurface,
  DialogTitle as FluentDialogTitle,
  DialogBody,
  DialogActions,
  DialogTrigger as FluentDialogTrigger,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';

const Dialog = FluentDialog;

const DialogTrigger = FluentDialogTrigger;

function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}) {
  return (
    <DialogSurface className={cn('bg-background border', className)}>
      <DialogBody>{children}</DialogBody>
    </DialogSurface>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left mb-4', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <DialogActions
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: { className?: string; children: React.ReactNode }) {
  return (
    <FluentDialogTitle className={cn('text-lg leading-none font-semibold', className)} {...props} />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
