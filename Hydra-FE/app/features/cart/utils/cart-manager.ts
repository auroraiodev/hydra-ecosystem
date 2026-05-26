import type { CardData } from '@/features/products/types';
import { tokenStore } from '@/lib/utils/tokenStore';
import { getCart as getCartApi } from './api';
import { resolveLanguageName, normalizePrice } from '@/lib/utils/transformers';
import { fetchValuedPrice } from '@/features/products/utils/api';
import type { CartItem, Cart } from '../types';

export const CART_STORAGE_KEY = 'hydra_cart';

// Helper function to decode JWT token (without verification)
function decodeJWT(token: string): { exp?: number; sub?: string; [key: string]: unknown } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  const exp = decoded.exp * 1000;
  return Date.now() >= exp;
}

export function getCartFromStorage(): Cart {
  if (typeof window === 'undefined') {
    return { items: [], updatedAt: Date.now() };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const cart = JSON.parse(stored) as Cart;
      if (cart.items && Array.isArray(cart.items)) {
        return cart;
      }
    }
  } catch (error) {
    console.error('Error reading cart from localStorage:', error);
  }

  return { items: [], updatedAt: Date.now() };
}

export function saveCartToStorage(cart: Cart): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
}

export function resolveCartItemPrice(
  productData: (Omit<CardData, 'price'> & { price?: string | number; price_mxn?: number; finalPrice?: number }) | null | undefined,
  unitPrice?: number | string | null
): string {
  return (
    normalizePrice(productData?.price) ||
    normalizePrice(unitPrice) ||
    normalizePrice(productData?.finalPrice) ||
    normalizePrice(productData?.price_mxn_local) ||
    normalizePrice(productData?.price_mxn_importation) ||
    normalizePrice(productData?.price_mxn) ||
    (productData?.price ? String(productData.price) : '')
  );
}

class CartManager {
  private cart: Cart = { items: [], updatedAt: Date.now() };
  private storageLoaded = false;
  private isLoaded = false;
  private isLoading = false;
  private hasSyncedOnLogin = false;
  private isLoadingRef = false;
  private lastLoadTime = 0;
  private lastAuthState: string | null = null;
  private listeners = new Set<() => void>();
  private LOAD_DEBOUNCE_MS = 2000;

  private initFromStorage() {
    if (!this.storageLoaded && typeof window !== 'undefined') {
      this.cart = getCartFromStorage();
      this.storageLoaded = true;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  getCart(): Cart {
    this.initFromStorage();
    return this.cart;
  }

  getIsLoaded(): boolean {
    return this.isLoaded;
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }

  setCart(cart: Cart) {
    this.cart = cart;
    this.notify();
  }

  async loadCart(
    isAuthenticated: boolean,
    token: string | null,
    syncGuestCartToUser: () => Promise<void>
  ) {
    if (this.isLoadingRef) return;

    const currentAuthState = `${isAuthenticated ? 'auth' : 'guest'}-${token || 'no-token'}`;

    if (this.isLoaded && this.lastAuthState === currentAuthState) return;

    const now = Date.now();
    const timeSinceLastLoad = now - this.lastLoadTime;
    if (
      timeSinceLastLoad < this.LOAD_DEBOUNCE_MS &&
      this.lastLoadTime > 0 &&
      this.lastAuthState === currentAuthState
    ) {
      return;
    }

    const tokenInMemory = tokenStore.get();

    if (tokenInMemory && isTokenExpired(tokenInMemory)) {
      tokenStore.clear();
      this.hasSyncedOnLogin = false;
      this.setCart(getCartFromStorage());
      this.isLoaded = true;
      this.lastAuthState = 'guest-no-token';
      this.notify();
      return;
    }

    if (isAuthenticated && token && tokenInMemory && !isTokenExpired(tokenInMemory)) {
      this.isLoadingRef = true;
      this.lastLoadTime = Date.now();
      try {
        this.isLoading = true;

        if (!this.hasSyncedOnLogin) {
          await syncGuestCartToUser();
          this.lastAuthState = currentAuthState;
        }

        const response = await getCartApi();
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
                console.error('[CartManager] Error refetching product price:', err);
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

          this.cart = { items: apiItems, updatedAt: Date.now() };
        } else {
          this.cart = { items: [], updatedAt: Date.now() };
        }
        this.lastAuthState = currentAuthState;
      } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        if (
          err?.status === 401 ||
          err?.message?.includes('Unauthorized') ||
          err?.message?.includes('401')
        ) {
          tokenStore.clear();
          this.hasSyncedOnLogin = true;
          this.cart = getCartFromStorage();
          this.lastAuthState = 'guest-no-token';
        } else {
          console.error('[CartManager] Error loading cart from API:', error);
          this.cart = getCartFromStorage();
          this.lastAuthState = currentAuthState;
        }
      } finally {
        this.isLoading = false;
        this.isLoaded = true;
        this.isLoadingRef = false;
        // Single notification at the end to avoid render spam
        this.notify();
      }
    } else {
      if (this.hasSyncedOnLogin) this.hasSyncedOnLogin = false;
      this.cart = getCartFromStorage();
      this.isLoaded = true;
      this.lastAuthState = currentAuthState;
      this.notify();
    }
  }

  setHasSyncedOnLogin(value: boolean) {
    this.hasSyncedOnLogin = value;
  }

  getHasSyncedOnLogin(): boolean {
    return this.hasSyncedOnLogin;
  }

  clearListeners(): void {
    this.listeners.clear();
  }

  reset(): void {
    this.cart = { items: [], updatedAt: Date.now() };
    this.isLoaded = false;
    this.isLoading = false;
    this.isLoadingRef = false;
    this.hasSyncedOnLogin = false;
    this.lastAuthState = null;
    this.lastLoadTime = 0;
    this.notify();
  }

  async refreshCart(
    isAuthenticated: boolean,
    token: string | null,
    syncGuestCartToUser: () => Promise<void>
  ) {
    this.isLoaded = false;
    this.lastAuthState = null;
    this.lastLoadTime = 0;
    await this.loadCart(isAuthenticated, token, syncGuestCartToUser);
  }
}

export const cartManager = new CartManager();
