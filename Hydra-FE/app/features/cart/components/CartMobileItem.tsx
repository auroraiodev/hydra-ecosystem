import React, { memo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, Heart, Package, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { ShaderAnimation } from '@/features/shared/ui/shader-animation';
import { VaultProductBadges } from '@/features/shared/ui';
import { resolveLanguageName } from '@/lib/utils/transformers';
import type { CardData } from '@/features/products/types';

interface CartItemData {
  id: string;
  title: string;
  cardName?: string;
  subtitle?: string;
  expansion?: string;
  variant?: string;
  price: string | number;
  imageUrl?: string;
  foil?: boolean;
  language?: string;
  importationId?: string | null;
  stock?: number;
  quantity: number;
  cardNumber?: string;
}

interface CartItemProps {
  item: CartItemData;
  isAuthenticated: boolean;
  isInWishlist: (id: string) => boolean;
  addToWishlist: (id: string, data: CardData) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  formatPrice: (price: string | number) => string;
  success: (msg: string) => void;
}

export const CartMobileItem = memo(function CartMobileItem({
  item,
  isAuthenticated,
  isInWishlist,
  addToWishlist,
  removeFromCart,
  updateQuantity,
  formatPrice,
  success,
}: CartItemProps) {
  const router = useRouter();
  const displayTitle = item.cardName || item.title;
  const displaySubtitle =
    item.subtitle ||
    (item.expansion && item.variant && item.variant !== item.expansion
      ? `${item.expansion} · ${item.variant}`
      : item.expansion || item.variant);

  const outOfStock = item.stock !== undefined && item.stock <= 0;

  const handleQuantityChange = useCallback((delta: number) => {
    updateQuantity(item.id, item.quantity + delta);
  }, [item.id, item.quantity, updateQuantity]);

  return (
    <div className="bg-vault-surface rounded-2xl border border-vault-border overflow-hidden shadow-sm">
      <div className="p-4">
        <div className="flex gap-4">
          <Link
            href={`/singles/${item.id}`}
            className="relative w-20 aspect-[3/4] bg-vault-surface-low rounded-xl overflow-hidden flex-shrink-0 group"
          >
            {item.imageUrl ? (
              <>
                <Image
                  src={item.imageUrl}
                  alt={displayTitle}
                  fill
                  className="object-contain p-1 transition-transform group-hover:scale-105"
                  sizes="80px"
                  quality={75}
                />
                {item.foil === true && <ShaderAnimation />}
              </>
            ) : (
              <div className="size-full flex items-center justify-center text-vault-text-muted">
                <Package className="size-6" />
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <Link href={`/singles/${item.id}`} className="hover:text-teal transition-colors">
                <h3 className="font-semibold text-sm text-vault-text line-clamp-2 leading-tight">
                  {displayTitle}
                </h3>
              </Link>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      if (!isInWishlist(item.id)) {
                        addToWishlist(item.id, item as CardData);
                        success(`${displayTitle} agregado a favoritos`);
                      }
                    }}
                    className={`size-8 flex items-center justify-center rounded-lg transition-colors ${
                      isInWishlist(item.id)
                        ? 'text-rose-500 bg-rose-50'
                        : 'text-vault-text-muted hover:text-rose-500 hover:bg-rose-50'
                    }`}
                  >
                    <Heart className={`size-4 ${isInWishlist(item.id) ? 'fill-current' : ''}`} />
                  </button>
                )}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="size-8 flex items-center justify-center rounded-lg text-vault-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            {displaySubtitle && (
              <p className="text-xs text-vault-text-muted mb-2 truncate">
                {displaySubtitle}
                {item.cardNumber && <span className="ml-1">#{item.cardNumber}</span>}
              </p>
            )}

            <VaultProductBadges product={{ ...item, language: resolveLanguageName(item.language) }} className="mb-3" />

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-teal tabular-nums">
                {formatPrice(item.price)}
              </span>
              <div className="flex items-center bg-vault-surface-high rounded-xl overflow-hidden">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={item.quantity <= 1}
                  className="size-9 flex items-center justify-center text-vault-text-muted hover:text-vault-text disabled:opacity-40 transition-colors"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-vault-text tabular-nums">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="size-9 flex items-center justify-center text-vault-text-muted hover:text-vault-text transition-colors"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {outOfStock && (
          <div className="mt-4 flex flex-col gap-y-2.5">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="size-3.5 text-red-400 flex-shrink-0" />
              <p className="text-xs font-semibold text-red-400">Sin stock disponible</p>
            </div>
            <button
              onClick={() => {
                removeFromCart(item.id);
                router.push(`/singles/search?query=${encodeURIComponent(displayTitle)}`);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors w-full"
            >
              <ArrowRightLeft className="size-3.5" aria-hidden="true" />
              Buscar otra versión
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
CartMobileItem.displayName = 'CartMobileItem';

