'use client';

import { useCallback } from 'react';
import type { Cart } from '../types';
import { cartManager } from '../utils/cart-manager';

export function useCartTotals(cart: Cart) {
  const getItemQuantity = useCallback((itemId: string) => {
    const currentCart = cartManager.getCart();
    const item = currentCart.items.find((item) => item.id === itemId);
    return item?.quantity || 0;
  }, []);

  const getTotalItems = useCallback(() => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const getTotalPrice = useCallback(() => {
    return cart.items.reduce((total, item) => {
      let price = 0;
      if (item.price != null) {
        const priceString = item.price.toString();
        // Extract numeric value from price string (e.g., "$123.45 MXN" -> "123.45")
        const priceMatch = priceString.replace(/[^0-9.-]+/g, '');
        price = parseFloat(priceMatch) || 0;
      }
      
      if (price <= 0) {
        price =
          item.price_mxn_local ||
          item.price_mxn_importation ||
          item.finalPrice ||
          item.basePriceMXN ||
          0;
      }
      return total + price * item.quantity;
    }, 0);
  }, [cart]);

  return { getItemQuantity, getTotalItems, getTotalPrice };
}
