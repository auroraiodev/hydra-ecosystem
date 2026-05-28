import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductImageZoom } from '@/components/product-image-zoom';
import {
  Cart24Regular,
  Subtract24Regular,
  Add24Regular,
  Delete24Regular,
  SpinnerIos20Regular,
} from '@fluentui/react-icons';
import { resolveLanguageName } from '@/lib/format';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  img: string;
  expansion: string;
  condition: string;
  language: string;
  isFoil: boolean;
  productData?: {
    expansion?: string;
    cardNumber?: string;
    variant?: string;
    language?: string;
    lang?: string;
    isFoil?: boolean;
    cardName?: string;
    name?: string;
    title?: string;
    price?: string | number;
    img?: string;
    imageUrl?: string;
    finalPrice?: string | number;
  };
}

interface CartItemsCardProps {
  isLoadingCart: boolean;
  cartItems: CartItem[];
  totalItems: number;
  updatingItems: Set<string>;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  getItemName: (item: CartItem) => string;
  getItemPrice: (item: CartItem) => number;
}

const TEXTS = {
  cartItems: 'Cart Items',
  cartEmpty: 'Cart is empty. Search and add products above.',
  foil: 'FOIL',
  product: 'Product',
  qty: 'Qty',
  price: 'Price',
  total: 'Total',
};

export function CartItemsCard({
  isLoadingCart,
  cartItems,
  totalItems,
  updatingItems,
  onUpdateQuantity,
  onRemoveItem,
  getItemName,
  getItemPrice,
}: CartItemsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{TEXTS.cartItems} ({totalItems})</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingCart ? (
          <div className="space-y-3">
            {['sk-c1', 'sk-c2', 'sk-c3'].map((id) => (
              <div key={id} className="flex items-center gap-3">
                <Skeleton className="h-12 w-10 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Cart24Regular className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{TEXTS.cartEmpty}</p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="block sm:hidden space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <ProductImageZoom
                      src={item.productData?.imageUrl || item.productData?.img || item.img}
                      alt={getItemName(item)}
                      className="h-24 w-18"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getItemName(item)}</p>
                      {(item.productData?.expansion || item.expansion) && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {item.productData?.expansion || item.expansion}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                        <span>${getItemPrice(item).toFixed(2)} each</span>
                        <div className="flex items-center gap-1">
                          {(item.productData?.isFoil || item.isFoil) && (
                            <Badge className="text-[10px] px-1 py-0 bg-yellow-400 text-yellow-950 border-none font-bold">
                              {TEXTS.foil}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {resolveLanguageName(item.productData?.language || item.productData?.lang || item.language) || '—'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={updatingItems.has(item.id)}
                      >
                        <Subtract24Regular className="size-3" />
                      </Button>
                      <span className="text-sm w-4 text-center">
                        {updatingItems.has(item.id) ? '…' : item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={updatingItems.has(item.id)}
                      >
                        <Add24Regular className="size-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Delete24Regular className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left text-xs uppercase font-black tracking-wider">
                    <th className="pb-2 font-medium">{TEXTS.product}</th>
                    <th className="pb-2 font-medium text-center">{TEXTS.qty}</th>
                    <th className="pb-2 font-medium text-right">{TEXTS.price}</th>
                    <th className="pb-2 font-medium text-right">{TEXTS.total}</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cartItems.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <ProductImageZoom
                            src={item.productData?.imageUrl || item.productData?.img || item.img}
                            alt=""
                            className="h-12 w-9 rounded object-cover shadow-sm"
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[200px]">{getItemName(item)}</p>
                            {(item.productData?.expansion || item.expansion) && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                {item.productData?.expansion || item.expansion}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {(item.productData?.isFoil || item.isFoil) && (
                                <Badge className="text-[9px] px-1 py-0 bg-yellow-400 text-yellow-950 border-none font-bold">
                                  {TEXTS.foil}
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground font-bold">
                                {resolveLanguageName(item.productData?.language || item.productData?.lang || item.language) || '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-full hover:bg-muted"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={updatingItems.has(item.id)}
                          >
                            <Subtract24Regular className="size-3" />
                          </Button>
                          <span className="w-5 text-center font-mono font-medium">
                            {updatingItems.has(item.id) ? (
                              <SpinnerIos20Regular className="size-3 animate-spin mx-auto" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-full hover:bg-muted"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingItems.has(item.id)}
                          >
                            <Add24Regular className="size-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">
                        ${getItemPrice(item).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-semibold">
                        ${(getItemPrice(item) * item.quantity).toFixed(2)}
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <Delete24Regular className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
