'use client';

import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Cart24Regular } from '@fluentui/react-icons';

interface CartManagementDialogHeaderProps {
  userName: string;
  userEmail: string;
}

export function CartManagementDialogHeader({ userName, userEmail }: CartManagementDialogHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Cart24Regular className="size-5" />
        Manage Cart
      </DialogTitle>
      <DialogDescription>
        {userName} ({userEmail})
      </DialogDescription>
    </DialogHeader>
  );
}
