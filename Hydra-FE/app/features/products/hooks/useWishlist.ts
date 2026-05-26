import { useEffect, useCallback, useReducer } from 'react';
import { useAppSelector } from '@/lib/store';
import type { CardData } from '../types';
import { WISHLIST_KEY } from '../constants';
import { readWishlistCache, writeWishlistCache } from '../utils';

// Only standard UUID v4 strings are valid product IDs in our Postgres schema.
// Hareruya composite IDs (e.g. "98097-Inglés-7") must never reach the batch endpoint.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (id: string) => UUID_REGEX.test(id);

interface WishlistState {
  data: string[];
  isLoaded: boolean;
}

type WishlistAction =
  | { type: 'SET_DATA'; payload: string[] }
  | { type: 'SET_LOADED' }
  | { type: 'SET_EMPTY' };

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'SET_LOADED':
      return { ...state, isLoaded: true };
    case 'SET_EMPTY':
      return { data: [], isLoaded: true };
    default:
      return state;
  }
}

export function useWishlist() {
  const [{ data: wishlist, isLoaded }, dispatch] = useReducer(wishlistReducer, {
    data: [],
    isLoaded: false,
  });

  const { isAuthenticated, isLoading: authLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (authLoading) return;

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        dispatch({ type: 'SET_EMPTY' });
        return;
      }

      const stored = localStorage.getItem(WISHLIST_KEY);
      if (stored) {
        try {
          const parsed: string[] = JSON.parse(stored);
          // Strip any stale non-UUID entries (e.g. legacy Hareruya composite IDs)
          const cleaned = parsed.filter(isValidUuid);
          if (cleaned.length !== parsed.length) {
            // Persist the cleaned list so subsequent loads are clean too
            localStorage.setItem(WISHLIST_KEY, JSON.stringify(cleaned));
          }
          dispatch({ type: 'SET_DATA', payload: cleaned });
        } catch (error) {
          console.error('Error parsing wishlist from localStorage:', error);
          localStorage.removeItem(WISHLIST_KEY);
        }
      }
      dispatch({ type: 'SET_LOADED' });
    }, 0);

    return () => clearTimeout(timer);
  }, [isAuthenticated, authLoading]);

  const toggleWishlist = useCallback(
    (productId: string, productData?: CardData) => {
      if (!isAuthenticated) return;
      // Never persist composite Hareruya IDs — only UUIDs map to Postgres rows
      if (!isValidUuid(productId)) return;
      const removing = wishlist.includes(productId);
      const newWishlist = removing
        ? wishlist.filter((id) => id !== productId)
        : [...wishlist, productId];
      try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(newWishlist));
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
      if (!removing && productData) {
        const cache = readWishlistCache();
        cache[productId] = productData;
        writeWishlistCache(cache);
      } else if (removing) {
        const cache = readWishlistCache();
        delete cache[productId];
        writeWishlistCache(cache);
      }
      dispatch({ type: 'SET_DATA', payload: newWishlist });
    },
    [isAuthenticated, wishlist]
  );

  const addToWishlist = useCallback(
    (productId: string, productData?: CardData) => {
      if (!isAuthenticated) return;
      // Never persist composite Hareruya IDs — only UUIDs map to Postgres rows
      if (!isValidUuid(productId)) return;
      if (wishlist.includes(productId)) return;
      const newWishlist = [...wishlist, productId];
      try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(newWishlist));
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
      if (productData) {
        const cache = readWishlistCache();
        cache[productId] = productData;
        writeWishlistCache(cache);
      }
      dispatch({ type: 'SET_DATA', payload: newWishlist });
    },
    [isAuthenticated, wishlist]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      if (!isAuthenticated) return;
      const newWishlist = wishlist.filter((id) => id !== productId);
      try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(newWishlist));
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
      const cache = readWishlistCache();
      delete cache[productId];
      writeWishlistCache(cache);
      dispatch({ type: 'SET_DATA', payload: newWishlist });
    },
    [isAuthenticated, wishlist]
  );

  const clearWishlist = useCallback(() => {
    dispatch({ type: 'SET_DATA', payload: [] });
    try {
      localStorage.removeItem(WISHLIST_KEY);
      localStorage.removeItem('hydra_wishlist_cache');
    } catch (error) {
      console.error('Error clearing wishlist from localStorage:', error);
    }
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => isAuthenticated && wishlist.includes(productId),
    [isAuthenticated, wishlist]
  );

  const getWishlistProductCache = useCallback(
    (): Record<string, CardData> => readWishlistCache(),
    []
  );

  /** Keep only the provided IDs — removes stale/unresolvable entries in one write */
  const retainOnly = useCallback(
    (validIds: string[]) => {
      if (!isAuthenticated) return;
      const validSet = new Set(validIds);
      const cleaned = wishlist.filter((id) => validSet.has(id));
      if (cleaned.length !== wishlist.length) {
        try {
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(cleaned));
        } catch {
          // ignore
        }
        const cache = readWishlistCache();
        wishlist.forEach((id) => {
          if (!validSet.has(id)) delete cache[id];
        });
        writeWishlistCache(cache);
      }
      dispatch({ type: 'SET_DATA', payload: cleaned });
    },
    [isAuthenticated, wishlist]
  );

  return {
    wishlist,
    isLoaded,
    toggleWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    getWishlistProductCache,
    retainOnly,
    count: isAuthenticated ? wishlist.length : 0,
  };
}
