'use client';

import { Button } from '@/components/ui/button';
import { SafeImg } from '@/components/ui/safe-img';
import { Badge } from '@/components/ui/badge';
import { Subtract24Regular, Add24Regular, Delete24Regular, Cart24Regular, ArrowSync24Regular } from '@fluentui/react-icons';

interface CartItem {
  id: string;
  quantity: number;
  isImportation: boolean;
  importationId?: string;
  singleId?: string;
  productData?: {
    name?: string;
    cardName?: string;
    title?: string;
    price?: string | number;
    finalPrice?: number;
    imageUrl?: string;
    img?: string;
    language?: string;
    foil?: boolean;
    expansion?: string;
    [key: string]: unknown;
  };
}

interface CartManagementDialogCartItemsProps {
  cartItems: CartItem[];
  updatingItems: Set<string>;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export function CartManagementDialogCartItems({
  cartItems,
  updatingItems,
  onUpdateQuantity,
  onRemoveItem,
}: CartManagementDialogCartItemsProps) {
  const getItemName = (item: CartItem) =>
    item.productData?.cardName ||
    item.productData?.name ||
    item.productData?.title ||
    'Unknown Product';

  const getItemPrice = (item: CartItem) => {
    const pd = item.productData;
    if (!pd) return 0;
    if (typeof pd.price === 'number') return pd.price;
    if (typeof pd.price === 'string') return parseFloat(pd.price.replace(/[^0-9.-]+/g, '')) || 0;
    return (pd.finalPrice as number) || 0;
  };

  return (
    <>
      {cartItems.map((item) => (
        <div key={item.id} className="flex items-center gap-3 p-2">
          <SafeImg
            src={item.productData?.imageUrl || item.productData?.img}
            alt={getItemName(item)}
            className="h-20 w-15 object-cover rounded border"
            fallback={
              <div className="h-20 w-15 bg-muted rounded border flex items-center justify-center">
                <Cart24Regular className="size-6 text-muted-foreground opacity-20" />
              </div>
            }
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{getItemName(item)}</p>
            <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
              <span>${getItemPrice(item).toFixed(2)} each</span>
              <div className="flex items-center gap-1">
                {!!(item.productData?.foil || item.productData?.isFoil) && (
                  <Badge className="text-[10px] px-1 py-0 bg-yellow-400 text-yellow-950 border-none font-bold">
                    FOIL
                  </Badge>
                )}
                {!!(item.productData?.language || item.productData?.lang) && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-zinc-100 text-zinc-700 border-zinc-200 uppercase font-bold"
                  >
                    {item.productData?.language || (item.productData?.lang as string)}
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
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              disabled={updatingItems.has(item.id) || item.quantity <= 1}
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            >
              <Subtract24Regular className="size-3" />
            </Button>
            <span className="w-6 text-center text-sm">
              {updatingItems.has(item.id) ? (
                <ArrowSync24Regular className="size-3 animate-spin mx-auto" />
              ) : (
                item.quantity
              )}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              disabled={updatingItems.has(item.id)}
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            >
              <Add24Regular className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              disabled={updatingItems.has(item.id)}
              onClick={() => onRemoveItem(item.id)}
            >
              <Delete24Regular className="size-3" />
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}
