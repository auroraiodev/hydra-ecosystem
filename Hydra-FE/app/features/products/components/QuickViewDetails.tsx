import React, { memo, useCallback } from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { ConditionChip } from '@/features/shared/ui';
import { type CardData } from '@/features/products/types';

interface QuickViewDetailsProps {
  card: CardData;
  displayTitle: string;
  languageDisplay: string;
  isAdding: boolean;
  handleAddToCart: () => Promise<void>;
  isAuthenticated: boolean;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (id: string) => void;
  success: (msg: string) => void;
  onClose: () => void;
}

export const QuickViewDetails = memo(function QuickViewDetails({
  card,
  displayTitle,
  languageDisplay,
  isAdding,
  handleAddToCart,
  isAuthenticated,
  isInWishlist,
  toggleWishlist,
  success,
  onClose,
}: QuickViewDetailsProps) {
  const numericPrice = card.price ? parseFloat(card.price.replace(/[^0-9.-]+/g, '')) || 0 : 0;
  const showPrice = numericPrice > 0 ? card.price : 'Consultar';

  const handleWishlistToggle = useCallback(() => {
    if (card.isLocalInventory === false) {
      success('Solo el inventario local puede guardarse en favoritos');
      return;
    }
    toggleWishlist(card.id);
    success(
      isInWishlist(card.id)
        ? `${displayTitle} eliminado de favoritos`
        : `${displayTitle} agregado a favoritos`
    );
  }, [card.isLocalInventory, card.id, toggleWishlist, success, isInWishlist, displayTitle]);

  return (
    <>
      <div className="mb-5">
        {showPrice !== 'Consultar' && card.originalPrice && card.originalPrice !== card.price ? (
          <div className="flex items-center gap-3">
            <p className="text-2xl font-semibold text-primary">{showPrice}</p>
            <p className="text-lg text-text-muted line-through opacity-50">{card.originalPrice}</p>
          </div>
        ) : (
          <p className="text-2xl font-semibold text-primary">{showPrice}</p>
        )}
      </div>
      <div className="gap-y-0 mb-5 divide-y divide-border-subtle/40">
        {card.condition && (
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-text-muted">Condición</span>
            <ConditionChip condition={card.condition} />
          </div>
        )}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-text-muted">Idioma</span>
          <span className="font-semibold text-text-body">{languageDisplay}</span>
        </div>
        {card.expansion && (
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-text-muted">Expansión</span>
            <span className="font-semibold text-text-body">{card.expansion}</span>
          </div>
        )}
        {card.variant && (
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-text-muted">Variante</span>
            <span className="font-semibold text-text-body">{card.variant}</span>
          </div>
        )}
      </div>
      {card.stock !== undefined && (
        <div className="mb-5">
          {card.stock > 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="font-semibold text-sm">En stock ({card.stock} disponibles)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <div className="size-2 rounded-full bg-red-500" />
              <span className="font-semibold text-sm">Sin stock</span>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3">
        <FlowButton
          variant="default"
          size="lg"
          className="w-full"
          onClick={handleAddToCart}
          disabled={card.stock !== undefined && card.stock <= 0}
          aria-label={`Agregar ${displayTitle} al carrito`}
        >
          <div className="flex items-center justify-center gap-2 relative z-10">
            <span>
              {isAdding
                ? 'Agregando...'
                : card.stock !== undefined && card.stock <= 0
                  ? 'Sin stock'
                  : 'Agregar al carrito'}
            </span>
            <ShoppingCart className={`size-5 ${isAdding ? 'animate-pulse' : ''}`} />
          </div>
        </FlowButton>
        {isAuthenticated && (
          <FlowButton
            variant="outline"
            size="md"
            className={`w-full ${isInWishlist(card.id) ? 'border-red-300 text-red-600 hover:bg-red-50' : ''}`}
            onClick={handleWishlistToggle}
          >
            <span className="flex items-center justify-center gap-2">
              {isInWishlist(card.id) ? (
                <Heart className="size-5 fill-current text-red-500" />
              ) : (
                <Heart className="size-5" />
              )}
              <span>{isInWishlist(card.id) ? 'En favoritos' : 'Agregar a favoritos'}</span>
            </span>
          </FlowButton>
        )}
        <FlowButton variant="outline" size="md" className="w-full" asChild={true}>
          <a
            href={card.href || '#'}
            className="flex items-center justify-center gap-2"
            onClick={onClose}
          >
            Ver detalles completos
          </a>
        </FlowButton>
      </div>
    </>
  );
});
QuickViewDetails.displayName = 'QuickViewDetails';

