'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ArrowSync24Regular } from '@fluentui/react-icons';

interface LoadingModalProps {
  open: boolean;
  message?: string;
}

export function LoadingModal({ open, message = 'Loading...' }: LoadingModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* Blocking */
      }}
    >
      <DialogContent
        className="sm:max-w-[425px] flex flex-col items-center justify-center py-10 gap-4 [&>button]:hidden"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Loading</DialogTitle>
        <ArrowSync24Regular className="size-10 animate-spin text-primary" />
        <p className="text-lg font-medium">{message}</p>
      </DialogContent>
    </Dialog>
  );
}
