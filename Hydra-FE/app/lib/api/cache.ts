import { type Category } from './categories';

// Global cache for categories to persist across the session
export const categoriesCache: Record<string, Category[]> = {};

export function clearCategoriesCache(tcgId?: string) {
  if (tcgId) {
    delete categoriesCache[tcgId];
  } else {
    // Clear all
    Object.keys(categoriesCache).forEach((key) => delete categoriesCache[key]);
  }
}
