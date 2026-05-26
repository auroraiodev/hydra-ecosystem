import React, { memo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, Heart, Package, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { ShaderAnimation } from '@/features/shared/ui/shader-animation';
import { VaultProductBadges, FlowButton } from '@/features/shared/ui';
import { resolveLanguageName } from '@/lib/utils/transformers';
import type { CardData as CardDataType } from '@/features/products/types';

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
  addToWishlist: (id: string, data: CardDataType) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  formatPrice: (price: string | number) => string;
  success: (msg: string) => void;
}

export const CartDesktopItem = memo(function CartDesktopItem({
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
    <div className="bg-vault-surface rounded-xl border border-vault-border p-5 hover:border-teal/20 transition-colors">
      <div className="flex gap-5">
        <Link
          href={`/singles/${item.id}`}
          className="relative w-28 h-36 bg-vault-surface-low rounded-lg overflow-hidden flex-shrink-0 group"
        >
          {item.imageUrl ? (
            <>
              <Image
                src={item.imageUrl}
                alt={displayTitle}
                fill
                className="object-contain transition-transform group-hover:scale-105"
                sizes="112px"
                quality={80}
              />
              {item.foil === true && <ShaderAnimation />}
            </>
          ) : (
            <div className="size-full flex items-center justify-center text-vault-text-muted">
              <Package className="size-8" />
            </div>
          )}
        </Link>

        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <Link href={`/singles/${item.id}`} className="hover:text-teal transition-colors">
                <h3 className="font-semibold text-lg text-vault-text leading-tight mb-1">
                  {displayTitle}
                </h3>
              </Link>
              {displaySubtitle && (
                <p className="text-sm text-vault-text-muted">
                  {displaySubtitle}
                  {item.cardNumber && <span className="ml-1.5 text-xs">#{item.cardNumber}</span>}
                </p>
              )}
            </div>
            <span className="text-xl font-bold text-teal tabular-nums flex-shrink-0">
              {formatPrice(item.price)}
            </span>
          </div>

          <VaultProductBadges product={{ ...item, language: resolveLanguageName(item.language) }} className="mb-4" />

          {outOfStock && (
            <div className="mb-4 flex flex-col gap-y-2.5">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="size-4 text-red-400 flex-shrink-0" />
                <p className="text-sm font-semibold text-red-400">Sin stock disponible</p>
              </div>
              <button
                onClick={() => {
                  removeFromCart(item.id);
                  router.push(`/singles/search?query=${encodeURIComponent(displayTitle)}`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
              >
                <ArrowRightLeft className="size-3.5" aria-hidden="true" />
                Buscar otra versión
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-vault-border">
            <div className="flex items-center gap-1 bg-vault-surface-high rounded-lg">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={item.quantity <= 1}
                className="size-10 flex items-center justify-center rounded-lg text-vault-text-muted hover:text-vault-text hover:bg-vault-surface disabled:opacity-40 transition-colors"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center font-semibold text-vault-text tabular-nums">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="size-10 flex items-center justify-center rounded-lg text-vault-text-muted hover:text-vault-text hover:bg-vault-surface transition-colors"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <FlowButton
                  onClick={() => {
                    if (!isInWishlist(item.id)) {
                      addToWishlist(item.id, item as CardDataType);
                      success(`${displayTitle} agregado a favoritos`);
                    } else {
                      success(`${displayTitle} ya está en favoritos`);
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  className={`${isInWishlist(item.id) ? 'text-rose-500' : 'text-vault-text-muted hover:text-rose-500'}`}
                >
                  <Heart
                    className={`size-4 mr-1.5 ${isInWishlist(item.id) ? 'fill-current' : ''}`}
                  />
                  Favoritos
                </FlowButton>
              )}
              <FlowButton
                onClick={() => removeFromCart(item.id)}
                variant="ghost"
                size="sm"
                className="text-vault-text-muted hover:text-red-500"
              >
                <Trash2 className="size-4 mr-1.5" />
                Eliminar
              </FlowButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
CartDesktopItem.displayName = 'CartDesktopItem';

