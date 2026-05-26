'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PriceStockCardProps {
  finalPrice: string;
  stock: string;
  onChange: (field: string, value: string) => void;
}

export function PriceStockCard({ finalPrice, stock, onChange }: PriceStockCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Precio y Stock</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="finalPrice">Precio Final (MXN) *</Label>
            <Input
              id="finalPrice"
              type="number"
              step="0.01"
              min="0"
              value={finalPrice}
              onChange={(e) => onChange('finalPrice', e.target.value)}
              placeholder="0.00"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="stock">Stock *</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => onChange('stock', e.target.value)}
              placeholder="1"
              required
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
