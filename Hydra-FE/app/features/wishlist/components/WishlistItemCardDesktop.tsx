'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { ShaderAnimation } from '@/features/shared/ui/shader-animation';
import { VaultProductBadges } from '@/features/shared/ui';
import { VersionPicker } from '@/features/products/components';
import type { AlternativeVersion } from '@/lib/api';
import { resolveLanguageName } from '@/lib/utils/transformers';
import { WISHLIST_TEXT } from '../constants';
import type { WishlistItemProps, WishlistProduct } from '../types';

/**
 * Desktop-specific WishlistItemCard with larger layout and actions.
 */
export function WishlistItemCardDesktop({
  product,
  onRemove,
  onAddToCart,
  isAddingToCart,
  onVersionSelect,
}: WishlistItemProps) {
  const displayTitle = product.cardName || product.title;
  const displaySubtitle = product.expansion || product.variant;
  const outOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <div className="bg-vault-surface rounded-2xl border border-white/5 p-5 transition-all duration-300 hover:border-teal-500/30 hover:shadow-[0_0_30px_rgba(var(--glow-teal-rgb)/0.05)] group/card">
      <div className="flex gap-6">
        {/* Product Image */}
        <Link
          href={`/singles/${product.id}`}
          className="relative w-32 h-44 bg-white/5 rounded-xl overflow-hidden flex-shrink-0 group ring-1 ring-white/10"
        >
          {product.imageUrl ? (
            <>
              <Image
                src={product.imageUrl}
                alt={displayTitle || 'Carta'}
                fill
                className="object-contain transition-transform duration-500 group-hover:scale-110"
                sizes="128px"
                quality={80}
              />
              {product.foil === true && <ShaderAnimation />}
            </>
          ) : (
            <div className="size-full flex items-center justify-center text-text-muted">
              <Heart className="size-8 opacity-20" />
            </div>
          )}
        </Link>

        {/* Product Details */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <Link
                href={`/singles/${product.id}`}
                className="hover:text-teal-400 transition-colors"
              >
                <h3 className="font-semibold text-xl text-white tracking-tight leading-tight mb-1 truncate">
                  {displayTitle}
                </h3>
              </Link>
              {displaySubtitle && (
                <p className="text-sm text-text-muted font-medium">
                  {displaySubtitle}
                  {product.cardNumber && (
                    <span className="ml-2 text-xs opacity-60">#{product.cardNumber}</span>
                  )}
                </p>
              )}
            </div>
            <span className="text-2xl font-black text-teal-400 tabular-nums flex-shrink-0 drop-shadow-[0_0_15px_rgba(var(--glow-teal-rgb)/0.2)]">
              {product.price}
            </span>
          </div>

          <VaultProductBadges product={product} className="mb-4" />

          {/* Out of stock version picker */}
          {outOfStock && (
            <div className="mb-6 gap-y-4">
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <p className="text-sm font-semibold text-red-400">
                  {WISHLIST_TEXT.OUT_OF_STOCK_DESCRIPTION}
                </p>
              </div>
              <VersionPicker
                productId={product.id}
                onSelect={(alt: AlternativeVersion) => {
                  const newProduct: WishlistProduct = {
                    id: alt.id,
                    title: alt.name,
                    cardName: alt.cardName,
                    price: `$${alt.price.toFixed(2)} MXN`,
                    imageUrl: alt.imageUrl || '',
                    stock: alt.stock,
                    expansion: alt.expansion || undefined,
                    condition: alt.condition || undefined,
                    language: resolveLanguageName(alt.language) || alt.language || undefined,
                    foil: alt.foil,
                    importationId: alt.importationId,
                    isLocalInventory: alt.isLocalInventory,
                    variant: alt.variant || undefined,
                  };
                  onVersionSelect(product.id, newProduct);
                }}
                className="w-full"
              />
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
            <FlowButton
              onClick={() => onAddToCart(product)}
              disabled={isAddingToCart || outOfStock}
              variant="default"
              size="sm"
              className="gap-2 px-8 bg-teal-600 hover:bg-teal-500 text-white border-0 shadow-lg shadow-teal-500/20 h-10 font-bold"
            >
              <ShoppingCart className="size-4" />
              {isAddingToCart ? 'Agregando...' : WISHLIST_TEXT.ADD_TO_CART}
            </FlowButton>

            <button
              onClick={() => onRemove(product.id, displayTitle)}
              className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-red-400 transition-colors py-2 px-3 rounded-xl hover:bg-red-500/10"
            >
              <Trash2 className="size-4" />
              {WISHLIST_TEXT.REMOVE_BUTTON}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
