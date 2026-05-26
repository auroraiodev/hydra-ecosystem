'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Add24Regular,
  Subtract24Regular,
  Delete24Regular,
  ChevronUp24Regular,
  ChevronDown24Regular,
  ChevronUpDown24Regular,
} from '@fluentui/react-icons';
import { ProductImageZoom } from '@/components/product-image-zoom';

interface CartItemProductData {
  name?: string;
  cardName?: string;
  title?: string;
  price?: string | number;
  finalPrice?: number;
  imageUrl?: string;
  img?: string;
  language?: string;
  foil?: boolean;
  isFoil?: boolean;
  lang?: string;
  expansion?: string;
  cardNumber?: string;
  variant?: string;
  owner?: {
    id: string;
    email: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
}

interface CartItem {
  id: string;
  quantity: number;
  isImportation: boolean;
  productData?: CartItemProductData;
}

type SortField = 'name' | 'owner' | 'price' | 'total';

interface CartItemsDesktopTableProps {
  cartItems: CartItem[];
  updatingItems: Set<string>;
  getItemName: (item: CartItem) => string;
  getItemPrice: (item: CartItem) => number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

function SortIcon({ col, sortField, sortDir }: { col: SortField; sortField: SortField | ''; sortDir: 'asc' | 'desc' }) {
  if (sortField !== col) return <ChevronUpDown24Regular className="size-3 ml-1 opacity-40" />;
  return sortDir === 'asc'
    ? <ChevronUp24Regular className="size-3 ml-1" />
    : <ChevronDown24Regular className="size-3 ml-1" />;
}

export function CartItemsDesktopTable({
  cartItems,
  updatingItems,
  getItemName,
  getItemPrice,
  onUpdateQuantity,
  onRemoveItem,
}: CartItemsDesktopTableProps) {
  const [sortField, setSortField] = useState<SortField | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortField) return cartItems;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...cartItems].sort((a, b) => {
      switch (sortField) {
        case 'name': return getItemName(a).localeCompare(getItemName(b)) * dir;
        case 'owner': {
          const ownerName = (item: CartItem) => {
            const o = item.productData?.owner;
            if (!o) return '';
            return [o.first_name, o.last_name].filter(Boolean).join(' ') || o.username || o.email || '';
          };
          return ownerName(a).localeCompare(ownerName(b)) * dir;
        }
        case 'price': return (getItemPrice(a) - getItemPrice(b)) * dir;
        case 'total': return (getItemPrice(a) * a.quantity - getItemPrice(b) * b.quantity) * dir;
        default: return 0;
      }
    });
  }, [cartItems, sortField, sortDir, getItemName, getItemPrice]);

  const thSort = 'p-3 text-left cursor-pointer hover:bg-muted select-none font-medium';

  return (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className={thSort} onClick={() => handleSort('name')}>
              <span className="flex items-center">Product<SortIcon col="name" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className={thSort} onClick={() => handleSort('owner')}>
              <span className="flex items-center">Owner<SortIcon col="owner" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className="p-3 text-center font-medium">Qty</th>
            <th className={`${thSort} text-right`} onClick={() => handleSort('price')}>
              <span className="flex items-center justify-end">Price<SortIcon col="price" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className={`${thSort} text-right`} onClick={() => handleSort('total')}>
              <span className="flex items-center justify-end">Total<SortIcon col="total" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className="p-3 text-right w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((item) => (
            <tr key={item.id} className="hover:bg-muted/50">
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <ProductImageZoom
                    src={item.productData?.imageUrl || item.productData?.img}
                    alt={getItemName(item)}
                    className="h-16 w-12"
                  />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getItemName(item)}</p>
                    <div className="flex items-center gap-1 mb-1">
                      {(item.productData?.foil || item.productData?.isFoil) && (
                        <Badge className="text-[10px] px-1 py-0 bg-yellow-400 text-yellow-950 border-none font-bold">
                          FOIL
                        </Badge>
                      )}
                      {(item.productData?.language || item.productData?.lang) && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-zinc-100 text-zinc-700 border-zinc-200 uppercase font-bold">
                          {item.productData.language || item.productData.lang}
                        </Badge>
                      )}
                      {item.isImportation ? (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-orange-50 text-orange-700 border-orange-200">
                          Import
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-purple-50 text-purple-700 border-purple-200">
                          Local
                        </Badge>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[200px]">
                      {item.productData?.expansion && <span>{item.productData.expansion}</span>}
                      {item.productData?.cardNumber && <span>#{item.productData.cardNumber}</span>}
                      {item.productData?.variant && item.productData.variant !== item.productData.expansion && (
                        <>
                          <span className="mx-0.5">•</span>
                          <span>{item.productData.variant}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-3">
                {item.productData?.owner ? (
                  <div className="flex flex-col">
                    <span className="font-medium text-xs">
                      {[item.productData.owner.first_name, item.productData.owner.last_name].filter(Boolean).join(' ') || item.productData.owner.username || 'N/A'}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                      {item.productData.owner.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Hydra Inventory</span>
                )}
              </td>
              <td className="p-3">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    disabled={updatingItems.has(item.id) || item.quantity <= 1}
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  >
                    <Subtract24Regular className="size-3" />
                  </Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    disabled={updatingItems.has(item.id)}
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    <Add24Regular className="size-3" />
                  </Button>
                </div>
              </td>
              <td className="p-3 text-right">${getItemPrice(item).toFixed(2)}</td>
              <td className="p-3 text-right font-medium">
                ${(getItemPrice(item) * item.quantity).toFixed(2)}
              </td>
              <td className="p-3 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  disabled={updatingItems.has(item.id)}
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Delete24Regular className="size-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
