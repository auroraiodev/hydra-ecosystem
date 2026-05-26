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
 * Mobile-specific WishlistItemCard with version picker and actions.
 */
export function WishlistItemCard({
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
    <div className="bg-vault-surface rounded-2xl border border-white/5 overflow-hidden shadow-lg transition-all hover:border-teal-500/30">
      <div className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <Link
            href={`/singles/${product.id}`}
            className="relative w-20 aspect-[3/4] bg-white/5 rounded-xl overflow-hidden flex-shrink-0 group ring-1 ring-white/10"
          >
            {product.imageUrl ? (
              <>
                <Image
                  src={product.imageUrl}
                  alt={displayTitle || 'Carta'}
                  fill
                  className="object-contain p-1 transition-transform duration-500 group-hover:scale-110"
                  sizes="80px"
                  quality={75}
                />
                {product.foil === true && <ShaderAnimation />}
              </>
            ) : (
              <div className="size-full flex items-center justify-center text-text-muted">
                <Heart className="size-6 opacity-20" />
              </div>
            )}
          </Link>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <Link
                href={`/singles/${product.id}`}
                className="hover:text-teal-400 transition-colors"
              >
                <h3 className="font-semibold text-sm text-white line-clamp-2 leading-tight">
                  {displayTitle}
                </h3>
              </Link>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onRemove(product.id, displayTitle)}
                  className="size-8 flex items-center justify-center rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            {/* Subtitle */}
            {displaySubtitle && (
              <p className="text-[11px] text-text-muted mb-2 truncate font-medium">
                {displaySubtitle}
                {product.cardNumber && (
                  <span className="ml-1 opacity-60">#{product.cardNumber}</span>
                )}
              </p>
            )}

            <VaultProductBadges product={product} className="mb-3" />

            {/* Price + Action */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-teal-400 tabular-nums drop-shadow-[0_0_10px_rgba(var(--glow-teal-rgb)/0.3)]">
                {product.price}
              </span>
              <FlowButton
                variant="default"
                size="sm"
                onClick={() => onAddToCart(product)}
                disabled={isAddingToCart || outOfStock}
                className="rounded-xl px-4 py-2 h-auto text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white border-0 shadow-lg shadow-teal-500/20 disabled:opacity-50"
              >
                <ShoppingCart className="size-3.5 mr-1.5" />
                {isAddingToCart ? '...' : WISHLIST_TEXT.ADD_TO_CART}
              </FlowButton>
            </div>
          </div>
        </div>

        {/* Out of stock version picker */}
        {outOfStock && (
          <div className="mt-4 gap-y-3">
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs font-semibold text-red-600">
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
      </div>
    </div>
  );
}
