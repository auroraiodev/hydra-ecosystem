'use client';

import { useEffect, useCallback, useReducer } from 'react';
import type { CardData } from '@/features/products/types';
import { useAuth } from '@/features/auth';
import { mergeGuestCart as mergeGuestCartApi } from '../utils';
import type { AddCartItemRequest } from '../types';
import type { CartItem, Cart } from '../types';
import {
  cartManager,
  getCartFromStorage,
  saveCartToStorage,
  resolveCartItemPrice,
  CART_STORAGE_KEY,
} from '../utils/cart-manager';
import { resolveLanguageName, normalizePrice } from '@/lib/utils/transformers';
import { fetchValuedPrice } from '@/features/products/utils/api';

interface CartRefactorData {
  category: string;
  tcg: string;
  isLocal: boolean;
  idLocal: string | null;
  importationId: string | null;
  name: string;
  language: string;
  foil: boolean;
  isFoil: boolean;
}

interface CartSyncState {
  cart: Cart;
  isLoaded: boolean;
  isLoading: boolean;
}

type CartSyncAction =
  | { type: 'SYNC' }
  | { type: 'SET_CART'; payload: Cart }
  | { type: 'SET_LOADED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean };

function cartSyncReducer(state: CartSyncState, action: CartSyncAction): CartSyncState {
  switch (action.type) {
    case 'SYNC':
      return {
        cart: cartManager.getCart(),
        isLoaded: cartManager.getIsLoaded(),
        isLoading: cartManager.getIsLoading(),
      };
    case 'SET_CART':
      return { ...state, cart: action.payload };
    case 'SET_LOADED':
      return { ...state, isLoaded: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function useCartSync() {
  const { isAuthenticated, token } = useAuth();
  const [cartSyncState, cartDispatch] = useReducer(cartSyncReducer, {
    cart: cartManager.getCart(),
    isLoaded: cartManager.getIsLoaded(),
    isLoading: cartManager.getIsLoading(),
  });
  const { cart, isLoaded, isLoading } = cartSyncState;

  const syncGuestCartToUser = useCallback(async () => {
    if (!isAuthenticated || !token || cartManager.getHasSyncedOnLogin()) {
      return;
    }

    try {
      const guestCart = getCartFromStorage();

      if (guestCart.items.length === 0) {
        cartManager.setHasSyncedOnLogin(true);
        return;
      }

      const itemsToMerge: AddCartItemRequest[] = guestCart.items.map((guestItem) => {
        const isImportation = guestItem.isImportation || false;
        const singleId = !isImportation ? guestItem.singleId || guestItem.id : undefined;
        const importationId = isImportation ? guestItem.importationId || guestItem.id : undefined;

        const category = (guestItem.category || '').toUpperCase();
        const tcgName = (guestItem.tcg || '').toUpperCase();
        const isMtgSingle =
          category === 'SINGLES' ||
          category === 'MAGIC' ||
          guestItem.tcgId === 'bd789d3f-5569-4971-890e-e261e145e42c' ||
          tcgName === 'MAGIC';

        let cartRefactorData: CartRefactorData;
        if (isMtgSingle) {
          cartRefactorData = {
            category: 'SINGLES',
            tcg: 'MAGIC',
            isLocal: !isImportation,
            idLocal: !isImportation ? guestItem.singleId || guestItem.id : null,
            importationId: guestItem.importationId || null,
            name: guestItem.cardName || guestItem.title || '',
            language: guestItem.language || 'Inglés',
            foil: guestItem.foil === true,
            isFoil: guestItem.foil === true,
          };
        } else {
          cartRefactorData = {
            category: category || 'OTHER',
            tcg: tcgName || 'NONE',
            isLocal: !isImportation,
            idLocal: guestItem.id,
            importationId: guestItem.importationId || null,
            name: guestItem.cardName || guestItem.title || '',
            language: guestItem.language || 'Inglés',
            foil: guestItem.foil === true,
            isFoil: guestItem.foil === true,
          };
        }

        return {
          singleId,
          quantity: guestItem.quantity,
          isImportation,
          importationId,
          productData: {
            ...cartRefactorData,
            name: guestItem.cardName || guestItem.title || '',
            price: guestItem.price,
            imageUrl: guestItem.imageUrl,
            cardName: guestItem.cardName || guestItem.title || '',
            cardNumber: guestItem.cardNumber || '',
            expansion: guestItem.expansion || '',
            variant: guestItem.variant || '',
            condition: guestItem.condition || '',
            language: guestItem.language || 'Inglés',
            foil: guestItem.foil === true,
            isFoil: guestItem.foil === true,
            surgeFoil: guestItem.surgeFoil === true,
            isBundle: guestItem.isBundle === true,
            immediateDelivery: guestItem.immediateDelivery === true,
            isLocalInventory: guestItem.isLocalInventory === true,
            metadata: guestItem.metadata || [],
            tcgId:
              guestItem.tcgId || (isMtgSingle ? 'bd789d3f-5569-4971-890e-e261e145e42c' : undefined),
          },
        };
      });

      if (itemsToMerge.length > 0) {
        const response = await mergeGuestCartApi(itemsToMerge);

        if (response.success && response.data) {
          const apiItemsPromises = response.data.map(async (item) => {
            if (item.productData == null) return null;
            const productData = item.productData as CardData & { img?: string };
            const extItem = item as typeof item & { unit_price?: number | string; unitPrice?: number | string };
            let resolvedPrice = resolveCartItemPrice(productData, extItem.unit_price ?? extItem.unitPrice);

            const priceMatch = resolvedPrice.replace(/[^0-9.-]+/g, '');
            const numericPrice = parseFloat(priceMatch) || 0;
            if (numericPrice <= 0) {
              try {
                const productId = item.singleId || item.importationId || productData.id;
                if (productId) {
                  const fetchedPriceVal = await fetchValuedPrice(
                    productId,
                    productData.title || productData.cardName,
                    productData.language
                  );
                  if (fetchedPriceVal > 0) {
                    resolvedPrice = normalizePrice(fetchedPriceVal);
                  }
                }
              } catch (err) {
                console.error('[CartSync] Error refetching product price:', err);
              }
            }

            return {
              ...productData,
              price: resolvedPrice,
              imageUrl: productData.imageUrl || productData.img || '',
              title: productData.title || productData.cardName || '',
              language: resolveLanguageName(productData.language),
              id: productData.id || item.id,
              quantity: item.quantity,
              cartItemId: item.id,
              isImportation: item.isImportation,
              importationId: item.importationId,
              singleId: item.singleId,
            } as CartItem;
          });

          const resolvedApiItems = await Promise.all(apiItemsPromises);
          const apiItems = resolvedApiItems.filter((i): i is CartItem => i !== null);

          cartManager.setCart({
            items: apiItems,
            updatedAt: Date.now(),
          });
        }
      }

      localStorage.removeItem(CART_STORAGE_KEY);
      cartManager.setHasSyncedOnLogin(true);
    } catch (error) {
      console.error('Error syncing guest cart to user cart:', error);
      cartManager.setHasSyncedOnLogin(true);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const unsubscribe = cartManager.subscribe(() => {
      cartDispatch({ type: 'SYNC' });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    void cartManager.loadCart(isAuthenticated, token, syncGuestCartToUser);
  }, [isAuthenticated, token, syncGuestCartToUser]);

  useEffect(() => {
    if (isLoaded) {
      if (isAuthenticated) {
        localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        saveCartToStorage(cart);
      }
    }
  }, [cart, isLoaded, isAuthenticated]);

  return { cart, isLoaded, isLoading, syncGuestCartToUser };
}
