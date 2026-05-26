'use client';

import { type CardData } from '@/features/products/types';

interface QuickViewBadgesProps {
  card: CardData;
  showImmediateDelivery: boolean;
  showImportacionBadge: boolean;
}

export function QuickViewBadges({
  card,
  showImmediateDelivery,
  showImportacionBadge,
}: QuickViewBadgesProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {card.isNew && (
        <span className="bg-green-500 px-2 py-1 rounded text-white text-xs font-semibold">
          Nuevo
        </span>
      )}
      {card.isOnSale && card.discountPercentage && (
        <span className="bg-red-500 px-2 py-1 rounded text-white text-xs font-semibold">
          -{card.discountPercentage}%
        </span>
      )}
      {showImmediateDelivery && (
        <span className="bg-primary px-2 py-1 rounded text-white text-xs font-semibold">
          Entrega Inmediata
        </span>
      )}
      {showImportacionBadge && (
        <span className="bg-orange-500 px-2 py-1 rounded text-white text-xs font-semibold">
          Importación
        </span>
      )}
      {card.surgeFoil === true ? (
        <span className="bg-primary px-2 py-1 rounded text-white text-xs font-semibold">
          Surge Foil
        </span>
      ) : (
        card.foil === true && (
          <span className="bg-surface-high px-2 py-1 rounded text-text-muted text-xs font-semibold">
            Foil
          </span>
        )
      )}
    </div>
  );
}
