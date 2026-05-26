'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SafeImg } from '@/components/ui/safe-img';
import {
  Add24Regular,
  Subtract24Regular,
  Delete24Regular,
  Cart24Regular,
} from '@fluentui/react-icons';
import { resolveLanguageName } from '@/lib/format';
import type { CartItem } from '../types';

interface CartItemRowProps {
  item: CartItem;
  isUpdating: boolean;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItemRow({ item, isUpdating, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const itemName =
    item.productData?.cardName ||
    item.productData?.name ||
    item.productData?.title ||
    'Unknown Product';

  const getItemPrice = () => {
    const pd = item.productData;
    if (!pd) return 0;
    if (typeof pd.price === 'number') return pd.price;
    if (typeof pd.price === 'string') {
      const match = pd.price.replace(/[^0-9.-]+/g, '');
      return parseFloat(match) || 0;
    }
    return pd.finalPrice || 0;
  };

  return (
    <div className="flex items-center gap-3 p-2">
      <SafeImg
        src={item.productData?.imageUrl || item.productData?.img}
        alt={itemName}
        className="h-20 w-15 object-cover rounded border"
        fallback={
          <div className="h-20 w-15 bg-muted rounded border flex items-center justify-center">
            <Cart24Regular className="size-6 text-muted-foreground opacity-20" />
          </div>
        }
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{itemName}</p>
        <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
          <span>${getItemPrice().toFixed(2)} each</span>
          <div className="flex items-center gap-1">
            {(item.productData?.foil || item.productData?.isFoil) && (
              <Badge className="text-[10px] px-1 py-0 bg-yellow-400 text-yellow-950 border-none font-bold">
                FOIL
              </Badge>
            )}
            {(item.productData?.language || item.productData?.lang) && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-zinc-100 text-zinc-700 border-zinc-200 uppercase font-bold"
              >
                {resolveLanguageName(item.productData?.language || item.productData?.lang)}
              </Badge>
            )}
            {item.isImportation && (
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 bg-orange-50 text-orange-700 border-orange-200"
              >
                Import
              </Badge>
            )}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
          {item.productData?.expansion && <span>{item.productData.expansion}</span>}
          {item.productData?.cardNumber && <span>#{item.productData.cardNumber}</span>}
          {item.productData?.variant && item.productData.variant !== item.productData?.expansion && (
            <>
              <span className="mx-0.5">•</span>
              <span>{item.productData.variant}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          disabled={isUpdating || item.quantity <= 1}
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
        >
          <Subtract24Regular className="size-3" />
        </Button>
        <span className="w-6 text-center text-sm">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          disabled={isUpdating}
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
        >
          <Add24Regular className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          disabled={isUpdating}
          onClick={() => onRemove(item.id)}
        >
          <Delete24Regular className="size-3" />
        </Button>
      </div>
    </div>
  );
}
