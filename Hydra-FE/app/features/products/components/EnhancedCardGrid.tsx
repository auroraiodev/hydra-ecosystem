'use client';

import { useState } from 'react';
import { PrefetchLink as Link } from '@/features/shared/ui/PrefetchLink';
import { ShoppingCart } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import {
  type EnhancedCardProps,
  computeFinalHref,
  useCardActions,
  CardActionButtons,
  CardImage,
} from '@/features/products';
import { VaultProductBadges } from '@/features/shared/ui';
import { resolveLanguageName } from '@/lib/utils/transformers';

export function EnhancedCardGrid({
  card,
  className = '',
  onQuickView,
  showWishlist = true,
  showQuickView = true,
  priority = false,
}: Omit<EnhancedCardProps, 'variant' | 'onCompare' | 'showCompare' | 'disableAnimation'>) {
  const [, setIsHovered] = useState(false);
  const displayTitle = card.cardName || card.title;
  const displaySubtitle =
    card.expansion && card.variant && card.variant !== card.expansion
      ? `${card.expansion} ${card.variant}`
      : card.expansion || card.variant;
  const displayCardNumber = card.cardNumber;

  const numericPrice = card.price ? parseFloat(card.price.replace(/[^0-9.-]+/g, '')) || 0 : 0;
  const showPrice = numericPrice > 0 ? card.price : 'Consultar';

  const finalHref = computeFinalHref(card);

  const {
    handleCardInteraction,
    handleAddToCart,
    handleWishlistToggle,
    handleQuickView,
    isInWishlist,
    isActionLoading,
    isAuthenticated,
  } = useCardActions(card, onQuickView);

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardInteraction();
    }
  };

  const cardContent = (
    <div
      className={`group vault-glass-card rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardInteraction}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      data-testid="product-card"
    >
      {finalHref && (
        <Link
          href={finalHref}
          className="absolute inset-0 z-0"
          aria-label={displayTitle}
          tabIndex={-1}
        >
          <span className="sr-only">{displayTitle}</span>
        </Link>
      )}
      <CardActionButtons
        cardId={card.id}
        showWishlist={showWishlist && isAuthenticated}
        showQuickView={showQuickView && !!onQuickView}
        isInWishlist={isInWishlist(card.id)}
        onWishlistClick={handleWishlistToggle}
        onQuickViewClick={handleQuickView}
      />

      <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
        {card.isNew && (
          <div className="bg-green-500 px-2 py-1 rounded text-white text-xs font-bold shadow-sm">
            Nuevo
          </div>
        )}
        {card.isOnSale && card.discountPercentage && (
          <div className="bg-red-500 px-2 py-1 rounded text-white text-xs font-bold shadow-sm">
            -{card.discountPercentage}%
          </div>
        )}
      </div>

      <div className="relative overflow-hidden shrink-0">
        <div className="aspect-square relative flex items-center justify-center p-1">
          <CardImage
            imageUrl={card.imageUrl}
            title={`${displayTitle} - Magic: The Gathering - ${card.expansion || ''} ${card.condition || ''} ${resolveLanguageName(card.language) || ''}`.trim()}
            isBundle={card.isBundle}
            foil={card.foil}
            imageClassName="transition-transform duration-500 group-hover:scale-105"
            priority={priority}
          />
        </div>
      </div>

      <div className="p-4 flex flex-col grow">
        <h3 className="font-semibold text-sm text-white mb-2 leading-tight line-clamp-2 group-hover:text-teal transition-colors">
          {displayTitle}
        </h3>

        <div className="flex items-center gap-2 mb-2 min-h-[18px]">
          {displaySubtitle && (
            <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-wider truncate">
              {displaySubtitle}
            </p>
          )}
          {displayCardNumber && (
            <span className="text-[10px] font-bold text-vault-text-muted">
              #{displayCardNumber}
            </span>
          )}
        </div>

        <VaultProductBadges product={card} className="mb-2" />

        <div className="mb-4 mt-auto">
        {showPrice !== 'Consultar' && card.originalPrice && card.originalPrice !== card.price ? (
            <div className="flex items-center gap-2">
              <p className="text-xl font-black text-teal drop-shadow-[0_0_10px_rgba(var(--glow-teal-rgb)/0.2)]">
                {showPrice}
              </p>
              <p className="text-sm text-vault-text-muted line-through opacity-70">
                {card.originalPrice}
              </p>
            </div>
          ) : (
            <p className="text-xl font-black text-teal drop-shadow-[0_0_10px_rgba(var(--glow-teal-rgb)/0.2)]">
              {showPrice}
            </p>
          )}
        </div>

        {card.stock !== undefined && (
          <div className="mb-4 flex items-center gap-2 text-[10px] font-bold text-vault-text-muted uppercase tracking-tight">
            {card.stock > 0 ? (
              <>
                <span className="size-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(var(--glow-green-rgb)/0.4)]"></span>
                <span>En stock ({card.stock})</span>
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(var(--glow-red-rgb)/0.4)]"></span>
                <span>Agotado</span>
              </>
            )}
          </div>
        )}
        <FlowButton
          size="sm"
          variant="default"
          className="w-full relative z-10"
          onClick={handleAddToCart}
          disabled={isActionLoading || (card.stock !== undefined && card.stock <= 0)}
          aria-label={`Agregar ${displayTitle} al carrito`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>
              {isActionLoading
                ? 'Agregando...'
                : card.stock !== undefined && card.stock <= 0
                  ? 'Sin stock'
                  : 'Al carrito'}
            </span>
            <ShoppingCart className={`size-4 ${isActionLoading ? 'animate-pulse' : ''}`} />
          </span>
        </FlowButton>
      </div>
    </div>
  );

  return cardContent;
}
