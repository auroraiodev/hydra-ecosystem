import React from 'react';
import { Button } from '@/components/ui/button';
import { Delete24Regular } from '@fluentui/react-icons';
import { toast } from 'sonner';
import { ordersAPI } from '@/lib/api';
import { useModal } from '@/components/providers/modal-context';

interface DeleteItemButtonProps {
  orderId: string;
  itemId: string;
  onItemDeleted: () => void;
}

export function DeleteItemButton({
  orderId,
  itemId,
  onItemDeleted,
}: DeleteItemButtonProps) {
  const { showLoading, hideModal } = useModal();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this item?')) return;

    showLoading('Removing item...');
    try {
      await ordersAPI.removeItems(orderId, [itemId]);
      toast.success('Item removed');
      onItemDeleted();
    } catch {
      toast.error('Failed to remove item');
    } finally {
      hideModal();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
      onClick={handleDelete}
    >
      <Delete24Regular className="size-4" />
    </Button>
  );
}
