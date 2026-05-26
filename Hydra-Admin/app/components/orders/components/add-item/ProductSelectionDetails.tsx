'use client';

import React from 'react';
import { Box24Regular } from '@fluentui/react-icons';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SafeImg } from '@/components/ui/safe-img';
import type { MinimalProduct } from './types';

interface ProductSelectionDetailsProps {
  selectedProduct: MinimalProduct;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onDeselect: () => void;
}

export function ProductSelectionDetails({
  selectedProduct,
  quantity,
  onQuantityChange,
  onDeselect,
}: ProductSelectionDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 border rounded-md bg-secondary/20">
        <div className="h-24 w-16 relative flex-shrink-0 bg-background rounded border overflow-hidden">
          <SafeImg
            src={selectedProduct.img || selectedProduct.imageUrl}
            alt={selectedProduct.cardName || selectedProduct.name}
            className="object-cover size-full"
            fallback={
              <div className="size-full flex items-center justify-center">
                <Box24Regular className="size-6 text-muted-foreground" />
              </div>
            }
          />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">
            {selectedProduct.cardName || selectedProduct.name}
          </h3>
          <p className="text-muted-foreground text-sm mb-2">
            {selectedProduct.expansion || selectedProduct.set_name}
          </p>
          <div className="flex flex-wrap gap-2 text-sm mt-1">
            <Badge variant="outline" className="text-xs">
              Stock: {selectedProduct.stock}
            </Badge>
            {selectedProduct.isImportationImport ? (
              <Badge
                variant="outline"
                className="text-xs bg-orange-50 text-orange-700 border-orange-200"
              >
                Import
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-xs bg-purple-50 text-purple-700 border-purple-200"
              >
                Local
              </Badge>
            )}
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 font-bold text-xs"
            >
              ${Number(selectedProduct.finalPrice ?? selectedProduct.price).toFixed(2)} MXN
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onDeselect}>
          Change
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            -
          </Button>
          <Input
            id="quantity"
            type="number"
            min="1"
            max={selectedProduct.stock}
            value={quantity}
            onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 text-center"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => onQuantityChange(Math.min(selectedProduct.stock || 999, quantity + 1))}
            disabled={quantity >= (selectedProduct.stock || 999)}
          >
            +
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Total: $
          {(Number(selectedProduct.finalPrice ?? selectedProduct.price) * quantity).toFixed(2)} MXN
        </p>
      </div>
    </div>
  );
}
