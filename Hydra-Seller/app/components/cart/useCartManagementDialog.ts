'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { adminCartAPI, singlesAPI } from '@/lib/api';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  quantity: number;
  isImportation: boolean;
  importationId?: string;
  singleId?: string;
  productData?: {
    name?: string;
    cardName?: string;
    title?: string;
    price?: string | number;
    finalPrice?: number;
    imageUrl?: string;
    img?: string;
    language?: string;
    foil?: boolean;
    expansion?: string;
  };
}

interface SearchResultProduct {
  id?: string;
  importationId?: string;
  importation_id?: string;
  name?: string;
  cardName?: string;
  title?: string;
  price?: string | number;
  imageUrl?: string;
  img?: string;
  language?: string;
  lang?: string;
  foil?: boolean;
  isFoil?: boolean;
  expansion?: string;
  variant?: string;
  cardNumber?: string;
  isLocalInventory?: boolean;
}

interface CartManagementDialogState {
  cartItems: CartItem[];
  isPending: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchResultProduct[];
  isSearching: boolean;
  addingToCart: Set<string>;
  updatingItems: Set<string>;
}

interface CartManagementDialogHandlers {
  handleSearch: () => Promise<void>;
  handleAddToCart: (product: SearchResultProduct) => Promise<void>;
  handleUpdateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  handleRemoveItem: (itemId: string) => Promise<void>;
  handleClearCart: () => Promise<void>;
}

export function useCartManagementDialog(
  userId: string,
  open: boolean
): {
  state: CartManagementDialogState;
  handlers: CartManagementDialogHandlers;
} {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const fetchCart = useCallback(async () => {
    if (!userId) return;
    startTransition(async () => {
      try {
        const response = await adminCartAPI.getCart(userId);
        const items = response?.data || response || [];
        setCartItems(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error('Failed to fetch cart:', err);
        toast.error('Failed to load cart');
      }
    });
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      fetchCart();
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open, userId, fetchCart]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await singlesAPI.list(1, 10, searchQuery);
      let results: SearchResultProduct[] = [];
      if (response?.data?.data) {
        results = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        results = response.data;
      } else if (Array.isArray(response)) {
        results = response;
      }
      setSearchResults(results);
    } catch {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleAddToCart = useCallback(async (product: SearchResultProduct) => {
    const productKey = product.id || product.importationId || String(Math.random());
    setAddingToCart((prev) => new Set(prev).add(productKey));
    try {
      const isImportation = !!product.importationId && !product.isLocalInventory;
      await adminCartAPI.addItem(userId, {
        singleId: isImportation ? undefined : product.id,
        quantity: 1,
        isImportation,
        importationId: isImportation ? product.importationId : undefined,
        productData: isImportation
          ? {
              name: product.name || product.cardName || product.title,
              cardName: product.cardName || product.name,
              importationId: product.importationId,
              language: product.language || 'English',
              foil: product.foil || false,
              price: product.price,
              imageUrl: product.imageUrl || product.img,
            }
          : undefined,
      });
      toast.success('Item added to cart');
      setSearchQuery('');
      setSearchResults([]);
      await fetchCart();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setAddingToCart((prev) => {
        const next = new Set(prev);
        next.delete(productKey);
        return next;
      });
    }
  }, [userId, fetchCart]);

  const handleUpdateQuantity = useCallback(async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await adminCartAPI.updateItem(userId, itemId, { quantity: newQuantity });
      setCartItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
      );
    } catch {
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [userId]);

  const handleRemoveItem = useCallback(async (itemId: string) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await adminCartAPI.removeItem(userId, itemId);
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [userId]);

  const handleClearCart = useCallback(async () => {
    if (!confirm("Clear all items from this user's cart?")) return;
    try {
      await adminCartAPI.clearCart(userId);
      setCartItems([]);
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
    }
  }, [userId]);

  const state: CartManagementDialogState = {
    cartItems,
    isPending,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    addingToCart,
    updatingItems,
  };

  const handlers: CartManagementDialogHandlers = {
    handleSearch,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
  };

  return { state, handlers };
}