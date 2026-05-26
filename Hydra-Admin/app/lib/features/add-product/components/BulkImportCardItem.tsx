'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { ImportationCard } from '../types';

interface BulkImportCardItemProps {
  card: ImportationCard;
  parsedFoil: boolean;
  parsedCardNumber: string;
  onSelect: (card: ImportationCard) => void;
}

export function BulkImportCardItem({
  card,
  parsedFoil,
  parsedCardNumber,
  onSelect,
}: BulkImportCardItemProps) {
  const isFoil = parsedFoil || card.foil || card.isFoil || false;
  const isBorderless = card.borderless || card.isBorderless || false;
  const cardNumber = card.cardNumber || parsedCardNumber || '';
  const cardLanguage = card.language || 'Inglés';

  const extractPrice = (priceString: string | number | undefined) => {
    if (!priceString) return 0;
    if (typeof priceString === 'number') return priceString;
    const match = String(priceString).match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  };

  const cardPrice =
    extractPrice(card.finalPrice) ||
    extractPrice(card.price) ||
    extractPrice(card.formattedPrice) ||
    0;

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full justify-start h-auto p-5 hover:bg-accent"
      onClick={() => onSelect(card)}
    >
      <div className="flex items-center gap-5 w-full">
        {card.img || card.imageUrl ? (
          <Image
            src={card.img || card.imageUrl || ''}
            alt={card.cardName || card.name || ''}
            width={160}
            height={224}
            className="w-40 h-56 object-cover rounded border-2"
          />
        ) : (
          <div className="w-40 h-56 bg-zinc-200 dark:bg-zinc-700 rounded border-2 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Sin imagen</span>
          </div>
        )}
        <div className="flex-1 text-left">
          <div className="font-bold text-lg mb-2">
            {card.cardName || card.name || card.title}
          </div>
          <div className="space-y-1">
            <div className="text-base text-muted-foreground">
              {String(card.expansion || card.setCode || '')}
            </div>
            {cardNumber && (
              <div className="text-base font-semibold text-blue-600">Número: {cardNumber}</div>
            )}
            <div className="text-base font-medium text-green-600">Idioma: {cardLanguage}</div>
            {card.price_mxn_local !== undefined && card.price_mxn_local > 0 && (
              <div className="text-base font-bold text-emerald-600">
                Local: ${card.price_mxn_local.toFixed(2)}
              </div>
            )}
            {card.price_mxn_importation !== undefined && card.price_mxn_importation > 0 && (
              <div className="text-base font-bold text-blue-600">
                Import: ${card.price_mxn_importation.toFixed(2)}
              </div>
            )}
            {!card.price_mxn_local && !card.price_mxn_importation && cardPrice > 0 && (
              <div className="text-base font-bold text-emerald-600">
                Precio: ${cardPrice.toFixed(2)}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {isFoil && (
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-[10px] font-bold uppercase">
                  FOIL
                </span>
              )}
              {card.surgeFoil && (
                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full text-[10px] font-bold uppercase">
                  SURGE
                </span>
              )}
              {card.isSerialized && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-[10px] font-bold uppercase">
                  SERIALIZED
                </span>
              )}
              {card.isShowcase && (
                <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 rounded-full text-[10px] font-bold uppercase">
                  SHOWCASE
                </span>
              )}
              {card.isAlternateFrame && (
                <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 rounded-full text-[10px] font-bold uppercase">
                  ALT FRAME
                </span>
              )}
              {isBorderless && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-[10px] font-bold uppercase">
                  BORDERLESS
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Button>
  );
}
