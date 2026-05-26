'use client';

import { useState } from 'react';
import { PrefetchLink as Link } from '@/features/shared/ui/PrefetchLink';
import { ShoppingCart } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import {
  type EnhancedCardProps,
  RatingStars,
  computeFinalHref,
  useCardActions,
  CardActionButtons,
  CardImage,
} from '@/features/products';
import { normalizePrice, resolveLanguageName } from '@/lib/utils/transformers';

export function EnhancedCardDefault({
  card,
  className = '',
  onQuickView,
  showWishlist = true,
  showQuickView = true,
  priority = false,
}: Omit<EnhancedCardProps, 'variant' | 'onCompare' | 'showCompare' | 'disableAnimation'>) {
  const [, setIsHovered] = useState(false);
  const displayTitle = card.cardName || card.title;

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
      className={`flex flex-col group cursor-pointer relative vault-glass-card rounded-2xl p-2.5 transition-all duration-300 ${className}`}
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

      <div className="relative w-full aspect-[5/7] rounded-xl overflow-hidden mb-3 group/image flex items-center justify-center">
        <CardImage
          imageUrl={card.imageUrl}
          title={`${displayTitle} - Magic: The Gathering - ${card.expansion || ''} ${card.condition || ''} ${resolveLanguageName(card.language) || ''}`.trim()}
          isBundle={card.isBundle}
          foil={card.foil}
          imageClassName="transition-transform duration-500 group-hover/image:scale-110"
          priority={priority}
        />

        {card.grade && (
          <div className="absolute top-2 left-2 bg-zinc-900/80 backdrop-blur-md px-2 py-1 rounded-[6px] border border-white/10 shadow-sm z-20">
            <p
              className={`text-[10px] font-semibold tracking-wide ${
                card.gradeColor || 'text-green-400'
              }`}
            >
              {card.grade}
            </p>
          </div>
        )}

        {card.isOnSale && card.discountPercentage && (
          <div className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded text-white text-xs font-semibold shadow-sm z-20">
            -{card.discountPercentage}%
          </div>
        )}

        {(card.foil === true || card.surgeFoil === true) && (
          <div className="absolute top-2 right-2 z-20">
            <div
              className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold shadow-sm uppercase tracking-wider ${card.surgeFoil === true ? 'bg-teal text-white' : 'bg-gold text-gold-foreground'}`}
            >
              {card.surgeFoil === true ? 'Surge Foil' : 'Foil'}
            </div>
          </div>
        )}

        <FlowButton
          variant="default"
          size="icon"
          className="absolute bottom-2 right-2 bg-teal text-white shadow-lg hover:bg-teal/80 active:scale-90 z-20"
          aria-label={`Agregar ${displayTitle} al carrito`}
          onClick={handleAddToCart}
          disabled={isActionLoading || (card.stock !== undefined && card.stock <= 0)}
        >
          <ShoppingCart className={`size-4 block ${isActionLoading ? 'animate-pulse' : ''}`} />
        </FlowButton>
      </div>

      <div className="px-1.5 gap-y-1">
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-teal transition-colors">
          {displayTitle}
        </h3>

        <RatingStars rating={card.rating} reviewCount={card.reviewCount} />

        {showPrice !== 'Consultar' && card.originalPrice && card.originalPrice !== card.price ? (
          <div className="flex items-center gap-2">
            <p className="text-teal font-semibold text-lg drop-shadow-[0_0_10px_rgba(var(--glow-teal-rgb)/0.2)]">
              {showPrice}
            </p>
            <p className="text-xs text-vault-text-muted line-through opacity-70">
              {normalizePrice(card.originalPrice)}
            </p>
          </div>
        ) : (
          <p className="text-teal font-semibold text-lg drop-shadow-[0_0_10px_rgba(var(--glow-teal-rgb)/0.2)]">
            {showPrice}
          </p>
        )}
      </div>
    </div>
  );

  return cardContent;
}
