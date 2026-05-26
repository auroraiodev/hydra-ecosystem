'use client';

import { useEffect, useState, useReducer, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useWishlist } from '@/features/products';
import { useCart } from '@/features/cart';
import { useAuth } from '@/features/auth';
import { useToastContext } from '@/features/shared/components/ToastProvider';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { CardSkeleton } from '@/features/shared/ui/CardSkeleton';
import { LoadingOverlay } from '@/features/shared/components';
import { getBatchSingles } from '@/lib/api';
import { WISHLIST_TEXT } from '../constants';
import { WishlistItemCard } from './WishlistItemCard';
import { WishlistItemCardDesktop } from './WishlistItemCardDesktop';
import { WishlistSummary } from './WishlistSummary';
import { WishlistEmptyState } from './WishlistEmptyState';
import type { WishlistProduct } from '../types';

function WishlistAuthLoadingView() {
  return (
    <div className="min-h-screen bg-vault-bg flex flex-col items-center justify-center p-6">
      <LoadingOverlay label="Cargando cuenta..." />
    </div>
  );
}

function WishlistLoadingView() {
  return (
    <div className="min-h-screen bg-vault-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-6xl flex flex-col lg:grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 gap-y-4">
          <CardSkeleton count={4} variant="wishlist" />
        </div>
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-vault-surface rounded-2xl border border-white/5 p-6 h-64 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function WishlistErrorView() {
  return (
    <div className="bg-vault-bg font-display text-text-body min-h-screen flex items-center justify-center antialiased p-6">
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="size-20 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-8 shadow-[0_0_30px_rgba(var(--glow-red-rgb)/0.1)]">
          <Heart className="size-10 text-red-400" />
        </div>
        <h2 className="text-3xl font-semibold text-white mb-4 tracking-tight">
          {WISHLIST_TEXT.ERROR_TITLE}
        </h2>
        <p className="text-text-muted mb-10 leading-relaxed font-medium">
          {WISHLIST_TEXT.ERROR_DESCRIPTION}
        </p>
        <FlowButton
          onClick={() => window.location.reload()}
          variant="default"
          size="lg"
          className="bg-white/10 hover:bg-white/20 text-white border-white/10 px-10 h-14 rounded-2xl font-bold"
        >
          {WISHLIST_TEXT.RELOAD_BUTTON}
        </FlowButton>
      </div>
    </div>
  );
}

function WishlistMobileLayout({
  products,
  totalItems,
  onRemove,
  onAddToCart,
  isAddingToCart,
  onVersionSelect,
  onAddAllToCart,
  isAddingAll,
  onClear,
}: {
  products: WishlistProduct[];
  totalItems: number;
  onRemove: (productId: string, name?: string) => void;
  onAddToCart: (card: WishlistProduct) => Promise<void>;
  isAddingToCart: Set<string>;
  onVersionSelect: (oldId: string, newProduct: WishlistProduct) => void;
  onAddAllToCart: () => Promise<void>;
  isAddingAll: boolean;
  onClear: () => void;
}) {
  return (
    <div className="lg:hidden pb-72">
      <div className="sticky top-0 z-20 bg-vault-bg/95 backdrop-blur-xl border-b border-vault-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-teal/10 flex items-center justify-center">
              <Heart className="size-5 text-teal" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">
                {WISHLIST_TEXT.TITLE}
              </h1>
              <p className="text-xs text-text-muted font-medium">
                {totalItems}{' '}
                {totalItems === 1 ? WISHLIST_TEXT.UNIT_SINGULAR : WISHLIST_TEXT.UNIT_PLURAL}
              </p>
            </div>
          </div>
          <FlowButton
            variant="ghost"
            simple
            onClick={onClear}
            className="text-red-400 text-xs font-semibold flex items-center gap-1.5 p-0 h-auto border-0 hover:bg-transparent"
          >
            <Trash2 className="size-4" />
            {WISHLIST_TEXT.CLEAR_BUTTON}
          </FlowButton>
        </div>
      </div>

      <div className="p-4 gap-y-3">
        {products.map((product) => (
          <WishlistItemCard
            key={product.id}
            product={product}
            onRemove={onRemove}
            onAddToCart={onAddToCart}
            isAddingToCart={isAddingToCart.has(product.id)}
            onVersionSelect={onVersionSelect}
          />
        ))}
      </div>

      <div className="fixed bottom-[72px] left-0 right-0 bg-vault-surface/90 backdrop-blur-xl border-t border-white/10 z-30 px-4 py-6 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] lg:hidden">
        <FlowButton
          variant="default"
          size="lg"
          className="w-full rounded-xl shadow-lg shadow-teal-500/20 bg-teal-600 hover:bg-teal-500 text-white border-0"
          onClick={onAddAllToCart}
          disabled={isAddingAll || products.every((p) => p.stock !== undefined && p.stock <= 0)}
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            {isAddingAll ? 'Agregando...' : WISHLIST_TEXT.ADD_ALL_TO_CART}
          </span>
        </FlowButton>
      </div>
    </div>
  );
}

function WishlistDesktopLayout({
  products,
  totalItems,
  onRemove,
  onAddToCart,
  isAddingToCart,
  onVersionSelect,
  onAddAllToCart,
  isAddingAll,
  onClear,
}: {
  products: WishlistProduct[];
  totalItems: number;
  onRemove: (productId: string, name?: string) => void;
  onAddToCart: (card: WishlistProduct) => Promise<void>;
  isAddingToCart: Set<string>;
  onVersionSelect: (oldId: string, newProduct: WishlistProduct) => void;
  onAddAllToCart: () => Promise<void>;
  isAddingAll: boolean;
  onClear: () => void;
}) {
  return (
    <div className="hidden lg:block max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-teal/10 flex items-center justify-center">
            <Heart className="size-6 text-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-vault-text">{WISHLIST_TEXT.TITLE}</h1>
            <p className="text-sm text-vault-text-muted">
              {totalItems}{' '}
              {totalItems === 1 ? WISHLIST_TEXT.UNIT_SINGULAR : WISHLIST_TEXT.UNIT_PLURAL} en tu
              lista
            </p>
          </div>
        </div>
        <FlowButton
          onClick={onClear}
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-white/5"
        >
          <Trash2 className="size-4 mr-2" />
          Vaciar lista
        </FlowButton>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 gap-y-4">
          {products.map((product) => (
            <WishlistItemCardDesktop
              key={product.id}
              product={product}
              onRemove={onRemove}
              onAddToCart={onAddToCart}
              isAddingToCart={isAddingToCart.has(product.id)}
              onVersionSelect={onVersionSelect}
            />
          ))}
        </div>
        <div className="col-span-1">
          <div className="sticky top-24">
            <WishlistSummary
              totalItems={totalItems}
              onAddAllToCart={onAddAllToCart}
              isAddingAll={isAddingAll}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductsState {
  data: WishlistProduct[];
  loading: boolean;
  fetchError: boolean;
}

type ProductsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: WishlistProduct[] }
  | { type: 'FETCH_ERROR' }
  | { type: 'CLEAR' }
  | { type: 'SET_DATA'; payload: WishlistProduct[] };

function productsReducer(state: ProductsState, action: ProductsAction): ProductsState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, fetchError: false };
    case 'FETCH_SUCCESS':
      return { data: action.payload, loading: false, fetchError: false };
    case 'FETCH_ERROR':
      return { ...state, loading: false, fetchError: true };
    case 'CLEAR':
      return { data: [], loading: false, fetchError: false };
    case 'SET_DATA':
      return { ...state, data: action.payload };
    default:
      return state;
  }
}

export function WishlistView() {
  const { wishlist, removeFromWishlist, clearWishlist, isLoaded, addToWishlist, retainOnly } =
    useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { replace } = useRouter();
  const toast = useToastContext();

  const [productsState, productsDispatch] = useReducer(productsReducer, {
    data: [],
    loading: false,
    fetchError: false,
  });
  const { data: products, loading, fetchError } = productsState;

  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [addingAllToCart, setAddingAllToCart] = useState(false);

  // Keep references to state values stable to optimize rendering handlers
  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const addingToCartRef = useRef(addingToCart);
  useEffect(() => {
    addingToCartRef.current = addingToCart;
  }, [addingToCart]);

  useEffect(() => {
    let isMounted = true;
    const fetchWishlistProducts = async () => {
      if (isLoaded && wishlist.length > 0) {
        // Optimize: check if we already have the products loaded to avoid redundant network reloads
        const productsSet = new Set(productsRef.current.map((p) => p.id));
        const isSubset = wishlist.every((id) => productsSet.has(id));
        const isSameSize = wishlist.length === productsRef.current.length;
        if (isSubset && isSameSize) {
          return;
        }

        productsDispatch({ type: 'FETCH_START' });
        try {
          const fetched = await getBatchSingles(wishlist);
          if (!isMounted) return;
          productsDispatch({ type: 'FETCH_SUCCESS', payload: fetched });
          retainOnly(fetched.map((p) => p.id));
        } catch {
          if (!isMounted) return;
          productsDispatch({ type: 'FETCH_ERROR' });
          toast.error('No se pudieron cargar los favoritos. Intenta recargar la página.');
        }
      } else if (isLoaded && wishlist.length === 0) {
        productsDispatch({ type: 'CLEAR' });
      }
    };
    fetchWishlistProducts();
    return () => {
      isMounted = false;
    };
  }, [wishlist, isLoaded, retainOnly, toast]);

  const handleAddToCart = useCallback(
    async (card: WishlistProduct) => {
      if (addingToCartRef.current.has(card.id)) return;
      setAddingToCart((prev) => new Set(prev).add(card.id));
      try {
        await addToCart(card, 1);
        toast.success(`"${card.cardName || card.title || 'Producto'}" agregado al carrito`);
      } catch {
        toast.error('No se pudo agregar al carrito. Intenta de nuevo.');
      } finally {
        setAddingToCart((prev) => {
          const next = new Set(prev);
          next.delete(card.id);
          return next;
        });
      }
    },
    [addToCart, toast]
  );

  const handleRemove = useCallback(
    (productId: string, name?: string) => {
      removeFromWishlist(productId);
      productsDispatch({
        type: 'SET_DATA',
        payload: productsRef.current.filter((p) => p.id !== productId),
      });
      toast.info(`"${name || 'Producto'}" eliminado de favoritos`);
    },
    [removeFromWishlist, toast]
  );

  const handleClearWishlist = useCallback(() => {
    const count = wishlist.length;
    clearWishlist();
    productsDispatch({ type: 'CLEAR' });
    toast.info(
      `${count} ${count === 1 ? 'producto eliminado' : 'productos eliminados'} de favoritos`
    );
  }, [clearWishlist, toast, wishlist.length]);

  const handleAddAllToCart = useCallback(async () => {
    const available = productsRef.current.filter((p) => p.stock === undefined || p.stock > 0);
    if (available.length === 0) {
      toast.warning('No hay productos con stock disponible.');
      return;
    }
    setAddingAllToCart(true);
    const results = await Promise.allSettled(available.map((product) => addToCart(product, 1)));
    const added = results.filter((r) => r.status === 'fulfilled').length;
    setAddingAllToCart(false);
    if (added === available.length) {
      toast.success(
        `${added} ${added === 1 ? 'producto agregado' : 'productos agregados'} al carrito`
      );
    } else if (added > 0) {
      toast.warning(`${added} de ${available.length} productos agregados al carrito`);
    } else {
      toast.error('No se pudo agregar ningún producto al carrito');
    }
  }, [addToCart, toast]);

  const handleVersionSelect = useCallback(
    (oldId: string, newProduct: WishlistProduct) => {
      removeFromWishlist(oldId);
      productsDispatch({
        type: 'SET_DATA',
        payload: [...productsRef.current.filter((p) => p.id !== oldId), newProduct],
      });
      addToWishlist(newProduct.id);
      toast.success(`Versión cambiada a ${newProduct.title}`);
    },
    [removeFromWishlist, addToWishlist, toast]
  );

  if (authLoading) {
    return <WishlistAuthLoadingView />;
  }

  if (!isAuthenticated) {
    replace('/login');
    return null;
  }

  if (!isLoaded || loading) {
    return <WishlistLoadingView />;
  }

  if (wishlist.length === 0) {
    return <WishlistEmptyState />;
  }

  if (fetchError) {
    return <WishlistErrorView />;
  }

  const totalItems = products.length;

  return (
    <div className="bg-vault-bg font-display text-text-body min-h-screen antialiased relative">
      <div className="absolute top-0 right-0 size-[600px] bg-teal/5 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 size-[400px] bg-teal/3 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4 pointer-events-none z-0" />

      <div className="relative z-10">
        <WishlistMobileLayout
          products={products}
          totalItems={totalItems}
          onRemove={handleRemove}
          onAddToCart={handleAddToCart}
          isAddingToCart={addingToCart}
          onVersionSelect={handleVersionSelect}
          onAddAllToCart={handleAddAllToCart}
          isAddingAll={addingAllToCart}
          onClear={handleClearWishlist}
        />
        <WishlistDesktopLayout
          products={products}
          totalItems={totalItems}
          onRemove={handleRemove}
          onAddToCart={handleAddToCart}
          isAddingToCart={addingToCart}
          onVersionSelect={handleVersionSelect}
          onAddAllToCart={handleAddAllToCart}
          isAddingAll={addingAllToCart}
          onClear={handleClearWishlist}
        />
      </div>
    </div>
  );
}
