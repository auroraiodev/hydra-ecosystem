'use client';

import { useState, useEffect, useCallback, useTransition, useReducer } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Cart24Regular } from '@fluentui/react-icons';
import { adminCartAPI, singlesAPI } from '@/lib/api';
import { toast } from 'sonner';

import { CartItemRow } from './components/CartItemRow';
import { CartSearch } from './components/CartSearch';
import { CartSummary } from './components/CartSummary';
import type { CartItem, MinimalProduct } from './types';

interface CartManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string;
}

interface SearchState {
  query: string;
  results: MinimalProduct[];
  isSearching: boolean;
}

type SearchAction =
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_RESULTS'; results: MinimalProduct[] }
  | { type: 'SET_SEARCHING'; isSearching: boolean }
  | { type: 'CLEAR' };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY': return { ...state, query: action.query };
    case 'SET_RESULTS': return { ...state, results: action.results };
    case 'SET_SEARCHING': return { ...state, isSearching: action.isSearching };
    case 'CLEAR': return { query: '', results: [], isSearching: false };
    default: return state;
  }
}

export function CartManagementDialog({
  open, onOpenChange, userId, userName, userEmail,
}: CartManagementDialogProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searchState, dispatchSearch] = useReducer(searchReducer, { query: '', results: [], isSearching: false });
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());

  const fetchCart = useCallback(async () => {
    if (!userId) return;
    startTransition(async () => {
      try {
        const response = await adminCartAPI.getCart(userId);
        const items = response?.data || response || [];
        setCartItems(Array.isArray(items) ? items : []);
      } catch {
        toast.error('Failed to load cart');
      }
    });
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      fetchCart();
      dispatchSearch({ type: 'CLEAR' });
    }
  }, [open, userId, fetchCart]);

  const handleSearch = async () => {
    if (!searchState.query.trim()) return;
    dispatchSearch({ type: 'SET_SEARCHING', isSearching: true });
    try {
      const response = await singlesAPI.list(1, 10, searchState.query);
      const results = response?.data?.data || response?.data || response || [];
      dispatchSearch({ type: 'SET_RESULTS', results: Array.isArray(results) ? results : [] });
    } catch {
      toast.error('Search failed');
    } finally {
      dispatchSearch({ type: 'SET_SEARCHING', isSearching: false });
    }
  };

  const handleAddToCart = async (product: MinimalProduct) => {
    const productKey = product.id || product.importationId || `temp-${Date.now()}`;
    setAddingToCart((prev) => new Set(prev).add(productKey));
    try {
      const isImportation = !!product.importationId && !product.isLocalInventory;
      await adminCartAPI.addItem(userId, {
        singleId: isImportation ? undefined : product.id,
        quantity: 1,
        isImportation,
        importationId: isImportation ? product.importationId : undefined,
        productData: isImportation ? {
          name: product.name || product.cardName || product.title,
          cardName: product.cardName || product.name,
          importationId: product.importationId,
          language: product.language || 'English',
          foil: product.foil || false,
          price: product.price,
          imageUrl: product.imageUrl || product.img,
        } : undefined,
      });
      toast.success('Item added to cart');
      dispatchSearch({ type: 'CLEAR' });
      await fetchCart();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setAddingToCart((prev) => {
        const next = new Set(prev);
        next.delete(productKey);
        return next;
      });
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await adminCartAPI.updateItem(userId, itemId, { quantity: newQuantity });
      setCartItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)));
    } catch { toast.error('Failed to update quantity'); }
    finally { setUpdatingItems((prev) => { const next = new Set(prev); next.delete(itemId); return next; }); }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await adminCartAPI.removeItem(userId, itemId);
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success('Item removed');
    } catch { toast.error('Failed to remove item'); }
    finally { setUpdatingItems((prev) => { const next = new Set(prev); next.delete(itemId); return next; }); }
  };

  const handleClearCart = async () => {
    if (!confirm("Clear all items from this user's cart?")) return;
    try { await adminCartAPI.clearCart(userId); setCartItems([]); toast.success('Cart cleared'); }
    catch { toast.error('Failed to clear cart'); }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-lg border-primary/5 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Cart24Regular className="size-4 text-primary" />
            </div>
            <span>Manage Cart</span>
          </DialogTitle>
          <DialogDescription className="font-medium text-foreground/70">
            {userName} ({userEmail})
          </DialogDescription>
        </DialogHeader>

        <CartSearch
          query={searchState.query}
          onQueryChange={(q) => dispatchSearch({ type: 'SET_QUERY', query: q })}
          onSearch={handleSearch}
          isSearching={searchState.isSearching}
          results={searchState.results}
          addingToCart={addingToCart}
          onAddToCart={handleAddToCart}
        />

        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
              Cart Items ({totalItems})
            </h4>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] font-bold uppercase tracking-widest text-destructive hover:text-destructive hover:bg-destructive/5"
                onClick={handleClearCart}
              >
                Clear All
              </Button>
            )}
          </div>

          {isPending ? (
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
          ) : cartItems.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-muted/20 border border-dashed border-primary/10">
              <Cart24Regular className="size-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground font-medium">Cart is empty</p>
            </div>
          ) : (
            <div className="border border-primary/5 rounded-2xl divide-y divide-primary/5 max-h-72 overflow-y-auto shadow-sm bg-background">
              {cartItems.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  isUpdating={updatingItems.has(item.id)}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
          )}
        </div>

        <CartSummary cartItems={cartItems} />
      </DialogContent>
    </Dialog>
  );
}
