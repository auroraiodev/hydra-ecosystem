import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Add24Regular, Delete24Regular, SpinnerIos20Regular } from '@fluentui/react-icons';

interface ProductListItem {
  id: string;
  name?: string;
  cardName?: string;
  expansion?: string;
  set_name?: string;
  variant?: string;
  price?: number;
  finalPrice?: number;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderItemsSectionProps {
  searchProduct: string;
  onSearchProductChange: (val: string) => void;
  products: ProductListItem[];
  searchingProducts: boolean;
  items: OrderItem[];
  onAddItem: (product: ProductListItem) => void;
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, qty: number) => void;
}

export function OrderItemsSection({
  searchProduct,
  onSearchProductChange,
  products,
  searchingProducts,
  items,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
}: OrderItemsSectionProps) {
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="space-y-2">
      <Label>Items</Label>
      <div className="relative">
        <Add24Regular className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search products to add…"
          value={searchProduct}
          onChange={(e) => onSearchProductChange(e.target.value)}
          className="pl-8"
        />
      </div>
      {searchProduct && products.length > 0 && (
        <div className="border rounded-md max-h-60 overflow-y-auto mt-2 bg-background w-full shadow-lg relative z-50">
          {products.map((product) => (
            <div
              key={product.id}
              role="button"
              tabIndex={0}
              className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center border-b last:border-b-0 transition-colors"
              onClick={() => onAddItem(product)}
              onKeyDown={(e) => e.key === 'Enter' && onAddItem(product)}
            >
              <div className="text-sm flex-1 min-w-0 mr-4">
                <div className="font-medium truncate">{product.cardName || product.name}</div>
                <div className="text-muted-foreground text-xs truncate">
                  {product.expansion || product.set_name || ''}{' '}
                  {product.variant ? `• ${product.variant}` : ''}
                </div>
              </div>
              <div className="text-sm font-bold whitespace-nowrap">
                ${Number(product.price || product.finalPrice || 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
      {searchProduct && searchingProducts && (
        <div className="text-sm text-muted-foreground text-center py-2 flex items-center justify-center gap-2">
          <SpinnerIos20Regular className="size-3 animate-spin" />
          Buscando productos…
        </div>
      )}
      {searchProduct && !searchingProducts && products.length === 0 && searchProduct.length >= 3 && (
        <div className="text-sm text-muted-foreground text-center py-2">
          No se encontraron productos
        </div>
      )}

      <div className="border rounded-md mt-2">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-right w-20">Qty</th>
              <th className="p-2 text-right w-24">Price</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                  No items added
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.productId} className="border-t">
                  <td className="p-2">{item.name}</td>
                  <td className="p-2 text-right">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(idx, parseInt(e.target.value) || 1)}
                      className="h-7 w-16 text-right ml-auto"
                    />
                  </td>
                  <td className="p-2 text-right">${item.unitPrice.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-destructive"
                      onClick={() => onRemoveItem(idx)}
                    >
                      <Delete24Regular className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-muted/50 font-medium">
              <tr>
                <td colSpan={2} className="p-2 text-right">
                  Total:
                </td>
                <td className="p-2 text-right">${total.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
