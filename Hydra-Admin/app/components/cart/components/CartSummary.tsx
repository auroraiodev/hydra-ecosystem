'use client';

import React from 'react';
import type { CartItem } from '../types';

interface CartSummaryProps {
  cartItems: CartItem[];
}

export function CartSummary({ cartItems }: CartSummaryProps) {
  const getItemPrice = (item: CartItem) => {
    const pd = item.productData;
    if (!pd) return 0;
    if (typeof pd.price === 'number') return pd.price;
    if (typeof pd.price === 'string') {
      const match = pd.price.replace(/[^0-9.-]+/g, '');
      return parseFloat(match) || 0;
    }
    return pd.finalPrice || 0;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (cartItems.length === 0) return null;

  return (
    <div className="border-t pt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">
        {totalItems} item{totalItems !== 1 ? 's' : ''} en total
      </span>
      <span className="font-bold text-primary tabular-nums">
        Subtotal: ${subtotal.toFixed(2)} MXN
      </span>
    </div>
  );
}
