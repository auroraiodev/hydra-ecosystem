'use client';

import { useCartSync } from './useCartSync';
import { useCartActions } from './useCartActions';
import { useCartTotals } from './useCartTotals';

/**
 * Main cart hook that composes specialized hooks for sync, actions, and totals.
 * Now located in the dedicated cart feature.
 */
export function useCart() {
  const { cart, isLoaded, isLoading, syncGuestCartToUser } = useCartSync();
  const actions = useCartActions(syncGuestCartToUser);
  const totals = useCartTotals(cart);

  return {
    cart,
    items: cart.items,
    isLoaded,
    isLoading,
    ...actions,
    ...totals,
  };
}
