'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Cart24Regular,
} from '@fluentui/react-icons';
import { CartManagementDialogHeader } from './CartManagementDialogHeader';
import { CartManagementDialogSearch } from './CartManagementDialogSearch';
import { CartManagementDialogCartItems } from './CartManagementDialogCartItems';
import { CartManagementDialogSummary } from './CartManagementDialogSummary';
import { useCartManagementDialog } from './useCartManagementDialog';

interface CartManagementDialogProps {
  open: boolean;
  onOpenChange: (event: unknown, data: { open: boolean }) => void;
  userId: string;
  userName: string;
  userEmail: string;
}

export function CartManagementDialog({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
}: CartManagementDialogProps) {
  const { state, handlers } = useCartManagementDialog(userId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-lg">
        <CartManagementDialogHeader
          userName={userName}
          userEmail={userEmail}
        />

        <CartManagementDialogSearch
          query={state.searchQuery}
          onQueryChange={state.setSearchQuery}
          onSearch={handlers.handleSearch}
          isSearching={state.isSearching}
          results={state.searchResults}
          addingToCart={state.addingToCart}
          onAddToCart={handlers.handleAddToCart}
        />

        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
              Cart Items ({state.cartItems.reduce((sum, item) => sum + item.quantity, 0)})
            </h4>
            {state.cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] font-bold uppercase tracking-widest text-destructive hover:text-destructive hover:bg-destructive/5"
                onClick={handlers.handleClearCart}
              >
                Clear All
              </Button>
            )}
          </div>

          {state.isPending ? (
            <div className="space-y-3">
              {['sk-1', 'sk-2', 'sk-3'].map((id) => (
                <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-primary/[0.02]">
                  <Skeleton className="size-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : state.cartItems.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-muted/20 border border-dashed border-primary/10">
              <Cart24Regular className="size-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground font-medium">Cart is empty</p>
            </div>
          ) : (
            <div className="border border-primary/5 rounded-2xl divide-y divide-primary/5 max-h-72 overflow-y-auto shadow-sm bg-background">
              <CartManagementDialogCartItems
                cartItems={state.cartItems}
                updatingItems={state.updatingItems}
                onUpdateQuantity={handlers.handleUpdateQuantity}
                onRemoveItem={handlers.handleRemoveItem}
              />
            </div>
          )}
        </div>

        <CartManagementDialogSummary cartItems={state.cartItems} />
      </DialogContent>
    </Dialog>
  );
}
