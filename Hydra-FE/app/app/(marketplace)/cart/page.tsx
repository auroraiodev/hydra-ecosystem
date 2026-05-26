'use client';

import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, Heart } from 'lucide-react';
import { useCart } from '@/features/cart';
import { useWishlist } from '@/features/products';
import { useAuth } from '@/features/auth';
import { useToastContext } from '@/features/shared/components/ToastProvider';
import { normalizePrice } from '@/lib/utils/transformers';
import { CartSkeleton } from '@/features/shared/components/skeletons';
import { FlowButton } from '@/features/shared/ui/flow-button';

import {
  CartEmptyState,
  CartMobileItem,
  CartDesktopItem,
  CartSummary,
  CartMobileActions,
} from '@/features/cart/components';

function formatPrice(price: string | number): string {
  const norm = normalizePrice(price);
  return norm && norm !== '$0.00 MXN' ? norm : 'Consultar';
}

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    clearCart,
    addToCart,
    isLoading,
    isLoaded,
  } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { success } = useToastContext();
  const { isAuthenticated } = useAuth();
  const { push } = useRouter();

  if (isLoading || !isLoaded) {
    return <CartSkeleton />;
  }

  const handleCheckout = () => {
    if (isAuthenticated) {
      push('/checkout');
    } else {
      push('/login?redirect=/checkout');
    }
  };

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  const finalTotal = totalPrice;
  const hasOutOfStock = items.some((item) => item.stock !== undefined && item.stock <= 0);

  // Empty state
  if (items.length === 0) {
    return <CartEmptyState />;
  }

  const itemProps = {
    isAuthenticated,
    isInWishlist,
    addToWishlist,
    removeFromCart,
    updateQuantity,
    addToCart,
    formatPrice,
    success,
  };

  return (
    <div className="dark bg-vault-bg font-display text-vault-text min-h-screen antialiased relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 right-0 size-[800px] bg-teal/5 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute top-[20%] left-0 size-[600px] bg-teal/3 rounded-full blur-[120px] -translate-x-1/3 pointer-events-none z-0" />

      {/* Mobile Layout */}
      <div className="lg:hidden pb-72 relative z-10">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-vault-bg/95 backdrop-blur-xl border-b border-vault-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-teal/10 flex items-center justify-center">
                  <ShoppingCart className="size-5 text-teal" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-vault-text">Carrito</h1>
                  <p className="text-xs text-vault-text-muted font-medium">
                    {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                  </p>
                </div>
              </div>
              <FlowButton
                variant="ghost"
                simple
                onClick={clearCart}
                className="text-red-500 text-xs font-semibold flex items-center p-0 h-auto border-0 hover:text-red-600"
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="size-4" />
                  Vaciar
                </span>
              </FlowButton>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="p-4 gap-y-3">
          {items.map((item) => (
            <CartMobileItem key={item.id} item={item} {...itemProps} />
          ))}
        </div>

        {isAuthenticated && (
          <div className="px-4 mb-4">
            <button
              onClick={() => {
                items.forEach((item) => {
                  const productId = item.id;
                  if (productId) addToWishlist(productId, item);
                });
                success('Todos los productos guardados en favoritos');
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-vault-surface border border-vault-border rounded-xl text-vault-text-muted font-medium text-sm active:scale-[0.98] transition-all"
            >
              <Heart className="size-5 text-rose-500" />
              Guardar todo en favoritos
            </button>
          </div>
        )}

        {/* Mobile: Fixed Bottom Checkout Bar */}
        <CartMobileActions
          totalItems={totalItems}
          totalPrice={totalPrice}
          finalTotal={finalTotal}
          handleCheckout={handleCheckout}
          formatPrice={(p) => formatPrice(p)}
        />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-6xl mx-auto px-6 py-10 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-teal/10 flex items-center justify-center">
              <ShoppingCart className="size-6 text-teal" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-vault-text">Carrito de Compras</h1>
              <p className="text-sm text-vault-text-muted">
                {totalItems} {totalItems === 1 ? 'producto' : 'productos'} en tu carrito
              </p>
            </div>
          </div>
          <FlowButton
            onClick={clearCart}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="size-4 mr-2" />
            Vaciar carrito
          </FlowButton>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="col-span-2 gap-y-4">
            {items.map((item) => (
              <CartDesktopItem key={item.id} item={item} {...itemProps} />
            ))}
          </div>

          {/* Order Summary */}
          <div className="col-span-1">
            <CartSummary
              totalItems={totalItems}
              totalPrice={totalPrice}
              finalTotal={finalTotal}
              hasOutOfStock={hasOutOfStock}
              handleCheckout={handleCheckout}
              formatPrice={(p) => formatPrice(p)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
