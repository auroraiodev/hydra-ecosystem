'use client';

import { useCallback } from 'react';
import type { CardData } from '@/features/products/types';
import { useAuth } from '@/features/auth';
import { useToastContext } from '@/features/shared/components/ToastProvider';
import {
  addCartItem as addCartItemApi,
  updateCartItem as updateCartItemApi,
  removeCartItem as removeCartItemApi,
  clearCart as clearCartApi,
} from '../utils';
import type { AddCartItemRequest } from '../types';
import type { CartItem, Cart } from '../types';
import { cartManager } from '../utils/cart-manager';
import { resolveLanguageCode, resolveLanguageName, normalizePrice } from '@/lib/utils/transformers';
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

export function useCartActions(syncGuestCartToUser: () => Promise<void>) {
  const { isAuthenticated, token } = useAuth();
  const { success: showSuccess, error: showError } = useToastContext();

  const addToCart = useCallback(
    async (cardParam: CardData, quantity: number = 1) => {
      if (!isAuthenticated || !token) {
        if (typeof window !== 'undefined') {
          const redirectPath = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?redirect=${redirectPath}`;
        }
        return;
      }

      const getValidPrice = (c: CardData): string => {
        return (
          normalizePrice(c.price) ||
          normalizePrice(c.price_mxn_local) ||
          normalizePrice(c.price_mxn_importation) ||
          normalizePrice(c.finalPrice) ||
          normalizePrice(c.originalPrice) ||
          (c.price ? String(c.price) : '') ||
          ''
        );
      };

      let resolvedPrice = getValidPrice(cardParam);
      const priceMatch = resolvedPrice.replace(/[^0-9.-]+/g, '');
      const numericPrice = parseFloat(priceMatch) || 0;

      if (numericPrice <= 0) {
        try {
          const productId = cardParam.id || cardParam.importationId;
          if (productId) {
            const fetchedPriceVal = await fetchValuedPrice(
              productId,
              cardParam.cardName || cardParam.title,
              cardParam.language
            );
            if (fetchedPriceVal > 0) {
              resolvedPrice = normalizePrice(fetchedPriceVal);
            }
          }
        } catch (err) {
          console.error('[useCartActions] Error refetching product price:', err);
        }
      }

      const card = {
        ...cardParam,
        price: resolvedPrice,
      };

      const isValidUUID =
        card.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(card.id) ||
        (card.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(card.id));

      const isLocal = Boolean(card.isLocalInventory && (isValidUUID || card.isBundle));
      const isImportation: boolean = !isLocal;
      const singleId = isLocal ? card.id : undefined;
      const importationIdRaw = isImportation ? card.importationId || card.id : card.importationId;
      const importationId = importationIdRaw ?? undefined;

      // New standardized data structure for logging and refactored payload
      // MTG TCG ID: bd789d3f-5569-4971-890e-e261e145e42c
      const category = (card.category || '').toUpperCase();
      const tcgName = (card.tcg || '').toUpperCase();
      const isMtgSingle =
        category === 'SINGLES' ||
        category === 'MAGIC' ||
        card.tcgId === 'bd789d3f-5569-4971-890e-e261e145e42c' ||
        tcgName === 'MAGIC';

      let cartRefactorData: CartRefactorData;
      if (isMtgSingle) {
        cartRefactorData = {
          category: 'SINGLES',
          tcg: 'MAGIC',
          isLocal: isLocal,
          idLocal: isLocal ? card.id : null,
          importationId: card.importationId || null,
          name: card.cardName || card.title || '',
          language: resolveLanguageCode(card.language),
          foil: card.foil === true,
          isFoil: card.foil === true,
        };
      } else {
        cartRefactorData = {
          category: category || 'OTHER',
          tcg: tcgName || 'NONE',
          isLocal: isLocal,
          idLocal: card.id,
          importationId: card.importationId || null,
          name: card.cardName || card.title || '',
          language: resolveLanguageCode(card.language),
          foil: card.foil === true,
          isFoil: card.foil === true,
        };
      }

      console.log('ADDING TO CART - REFACTORED DATA:', cartRefactorData);

      const addItemToCartState = (prevCart: Cart): Cart => {
        const existingItemIndex = prevCart.items.findIndex(
          (item) =>
            item.id === card.id &&
            (card.language != null && item.language != null
              ? resolveLanguageCode(item.language) === resolveLanguageCode(card.language)
              : item.language === card.language) &&
            item.foil === card.foil &&
            (item.importationId || null) === (card.importationId || null)
        );

        if (existingItemIndex >= 0) {
          const updatedItems = [...prevCart.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
          };
          return { items: updatedItems, updatedAt: Date.now() };
        } else {
          const newItem: CartItem = {
            ...card,
            language: resolveLanguageName(card.language) || card.language || 'Inglés',
            quantity,
            addedAt: Date.now(),
            isImportation,
            importationId,
            singleId,
          };
          return { items: [...prevCart.items, newItem], updatedAt: Date.now() };
        }
      };

      const newCart = addItemToCartState(cartManager.getCart());
      cartManager.setCart(newCart);
      const title = card.cardName || card.title || 'Artículo';

      if (isAuthenticated && token) {
        try {
          const request: AddCartItemRequest = {
            singleId,
            quantity,
            isImportation,
            importationId,
            tcgId: card.tcgId || (isMtgSingle ? 'bd789d3f-5569-4971-890e-e261e145e42c' : undefined),
            productData: {
              ...cartRefactorData,
              name: card.cardName || card.title || '',
              price: card.price,
              imageUrl: card.imageUrl,
              cardName: card.cardName || card.title || '',
              cardNumber: card.cardNumber || '',
              expansion: card.expansion || '',
              variant: card.variant || '',
              condition: card.condition || '',
              language: resolveLanguageCode(card.language),
              foil: card.foil === true,
              isFoil: card.foil === true,
              surgeFoil: card.surgeFoil === true,
              isBundle: card.isBundle === true,
              immediateDelivery: card.immediateDelivery === true,
              isLocalInventory: card.isLocalInventory === true,
              metadata: card.metadata || [],
              basePriceJPY: card.basePriceJPY,
              tcgId:
                card.tcgId || (isMtgSingle ? 'bd789d3f-5569-4971-890e-e261e145e42c' : undefined),
            },
          };

          const response = await addCartItemApi(request);
          if (response.success && response.data) {
            const cartItemIdToSet = response.data.id;
            const currentItems = cartManager.getCart().items;
            const updatedItems = currentItems.map((item) => {
              if (
                item.id === card.id &&
                (card.language != null && item.language != null
                  ? resolveLanguageCode(item.language) === resolveLanguageCode(card.language)
                  : item.language === card.language) &&
                item.foil === card.foil &&
                (item.importationId || null) === (card.importationId || null)
              ) {
                return { ...item, cartItemId: cartItemIdToSet };
              }
              return item;
            });
            cartManager.setCart({ items: updatedItems, updatedAt: Date.now() });
          }
          showSuccess(`"${title}" agregado al carrito`);
        } catch (error) {
          console.error('Error syncing cart with backend:', error);
          showError('Error al agregar al carrito. Inténtalo de nuevo.');
          throw error;
        }
      } else {
        showSuccess(`"${title}" agregado al carrito`);
      }
    },
    [isAuthenticated, token, showSuccess, showError]
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      const currentCartForApi = cartManager.getCart();
      const itemToRemove = currentCartForApi.items.find(
        (item) => item.id === itemId || item.cartItemId === itemId
      );

      const updateLocalState = () => {
        const currentCart = cartManager.getCart();
        cartManager.setCart({
          items: currentCart.items.filter(
            (item) => item.id !== itemId && item.cartItemId !== itemId
          ),
          updatedAt: Date.now(),
        });
      };

      updateLocalState();
      const title = itemToRemove?.title || itemToRemove?.cardName || 'Artículo';

      if (!isAuthenticated || !token) {
        if (itemToRemove) showSuccess(`"${title}" eliminado del carrito`);
      }

      const cartItemIdToRemove = itemToRemove?.cartItemId;
      if (isAuthenticated && token && cartItemIdToRemove) {
        try {
          await removeCartItemApi(cartItemIdToRemove);
          showSuccess(`"${title}" eliminado del carrito`);
        } catch (error) {
          console.error('Error removing item from cart:', error);
          showError('Error al eliminar del carrito. Inténtalo de nuevo.');
        }
      }
    },
    [isAuthenticated, token, showSuccess, showError]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const updateLocalState = (qty: number) => {
        const currentCart = cartManager.getCart();
        if (qty <= 0) {
          cartManager.setCart({
            items: currentCart.items.filter(
              (item) => item.id !== itemId && item.cartItemId !== itemId
            ),
            updatedAt: Date.now(),
          });
        } else {
          cartManager.setCart({
            items: currentCart.items.map((item) =>
              item.id === itemId || item.cartItemId === itemId ? { ...item, quantity: qty } : item
            ),
            updatedAt: Date.now(),
          });
        }
      };

      updateLocalState(quantity);

      if (quantity <= 0) {
        if (isAuthenticated && token) await removeFromCart(itemId);
        return;
      }

      if (isAuthenticated && token) {
        try {
          const currentCart = cartManager.getCart();
          const item = currentCart.items.find(
            (item) => item.id === itemId || item.cartItemId === itemId
          );
          if (item?.cartItemId) await updateCartItemApi(item.cartItemId, { quantity });
        } catch (error) {
          console.error('Error updating cart item:', error);
          showError('Error al actualizar la cantidad. Inténtalo de nuevo.');
        }
      }
    },
    [isAuthenticated, token, removeFromCart, showError]
  );

  const clearCart = useCallback(async () => {
    if (isAuthenticated && token) {
      try {
        await clearCartApi();
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
    cartManager.setCart({ items: [], updatedAt: Date.now() });
  }, [isAuthenticated, token]);

  const refreshCart = useCallback(async () => {
    await cartManager.refreshCart(isAuthenticated, token, syncGuestCartToUser);
  }, [isAuthenticated, token, syncGuestCartToUser]);

  return { addToCart, removeFromCart, updateQuantity, clearCart, refreshCart };
}
