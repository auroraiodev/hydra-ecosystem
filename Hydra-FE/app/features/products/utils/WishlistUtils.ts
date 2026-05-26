import { WISHLIST_CACHE_KEY } from '../constants';
import type { CardData } from '../types';

export function readWishlistCache(): Record<string, CardData> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function writeWishlistCache(cache: Record<string, CardData>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WISHLIST_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}
