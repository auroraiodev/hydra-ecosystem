'use client';

import { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { useCart } from '@/features/cart';
import { useWishlist } from '@/features/products';
import { usePublicSettings } from '@/features/shared';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setSelectedTcg, fetchActiveTcgs } from '@/lib/store/slices/gameSlice';
import type { Tcg } from '@/lib/types/tcg';
import { getCategoriesWithProducts, type Category } from '@/lib/api';
import { categoriesCache } from '@/lib/api/cache';
import { tcgNameToSlug } from '@/lib/utils/tcgSlug';
import { CATEGORY_NAME_MAP, CATEGORY_TO_PATH } from '@/features/search-filters/constants';
import { REFETCH_INTERVAL_MS } from '../constants';
import type { DropdownPos } from '../types';
import type { ReadonlyURLSearchParams } from 'next/navigation';

// Global cache for categories is now handled in @/lib/api/cache

export function useWebNavbar(searchParams: ReadonlyURLSearchParams) {
  const dispatch = useAppDispatch();
  const { push } = useRouter();
  const pathname = usePathname();
  const sp = searchParams;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { getTotalItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { settings } = usePublicSettings();

  const { activeTcgs, selectedTcg, categoriesByTcg } = useAppSelector((state) => state.game);

  interface CatsState {
    categories: Category[];
    catsLoading: boolean;
    catsError: boolean;
  }

  type CatsAction =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: Category[] }
    | { type: 'FETCH_ERROR' }
    | { type: 'SKIP' };

  function catsReducer(state: CatsState, action: CatsAction): CatsState {
    switch (action.type) {
      case 'FETCH_START':
        return { categories: [], catsLoading: true, catsError: false };
      case 'FETCH_SUCCESS':
        return { categories: action.payload, catsLoading: false, catsError: false };
      case 'FETCH_ERROR':
        return { ...state, catsLoading: false, catsError: true };
      case 'SKIP':
        return { ...state, catsLoading: false, catsError: false };
      default:
        return state;
    }
  }

  const [catsState, catsDispatch] = useReducer(catsReducer, {
    categories: [],
    catsLoading: false,
    catsError: false,
  });
  const { categories, catsLoading, catsError } = catsState;
  const [openTcgId, setOpenTcgId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);
  const [mounted, setMounted] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => setMounted(true));
  }, []);

  const refetchTcgs = useCallback(() => dispatch(fetchActiveTcgs()), [dispatch]);

  useEffect(() => {
    if (activeTcgs.length === 0) refetchTcgs();
  }, [activeTcgs.length, refetchTcgs]);

  useEffect(() => {
    let lastFetch = Date.now();
    const onFocus = () => {
      if (Date.now() - lastFetch > REFETCH_INTERVAL_MS) {
        lastFetch = Date.now();
        refetchTcgs();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus();
    };
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refetchTcgs]);

  useEffect(() => {
    if (!openTcgId) return;

    // Skip fetch if we already have it in Redux or Cache
    if (
      (categoriesByTcg[openTcgId] && categoriesByTcg[openTcgId].length > 0) ||
      categoriesCache[openTcgId]
    ) {
      void Promise.resolve().then(() => catsDispatch({ type: 'SKIP' }));
      return;
    }

    // 3. Fetch from API if not found
    void Promise.resolve().then(() => catsDispatch({ type: 'FETCH_START' }));

    getCategoriesWithProducts(openTcgId)
      .then((cats) => {
        categoriesCache[openTcgId] = cats;
        catsDispatch({ type: 'FETCH_SUCCESS', payload: cats });
      })
      .catch((err) => {
        console.error('[WebNavbar] getActiveCategories failed:', err);
        catsDispatch({ type: 'FETCH_ERROR' });
      });
  }, [openTcgId, activeTcgs, categoriesByTcg]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!barRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpenTcgId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => setOpenTcgId(null));
  }, [pathname, sp]);

  const handleTcgClick = (tcg: Tcg, e: React.MouseEvent, isOverflow?: boolean) => {
    // Only dispatch on actual click
    if (selectedTcg?.id !== tcg.id) dispatch(setSelectedTcg(tcg));

    const isAlreadyOpen = openTcgId === tcg.id;
    if (isAlreadyOpen) {
      setOpenTcgId(null);
      setDropdownPos(null);
    } else {
      try {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        if (isOverflow) {
          setDropdownPos({ left: rect.left - 200, top: rect.top });
        } else {
          setDropdownPos({ left: rect.left, top: rect.bottom + 0 });
        }
      } catch {
        setDropdownPos({ left: 24, top: 100 });
      }
      setOpenTcgId(tcg.id);
    }
  };

  const handleTcgHover = (tcg: Tcg, e: React.MouseEvent, isOverflow?: boolean) => {
    // On hover, we ONLY want to open the dropdown, NOT change the global selectedTcg
    try {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      if (isOverflow) {
        setDropdownPos({ left: rect.left - 200, top: rect.top });
      } else {
        setDropdownPos({ left: rect.left, top: rect.bottom + 0 });
      }
      setOpenTcgId(tcg.id);
    } catch {
      // Ignore errors in hover measurement
    }
  };

  const handleCategoryClick = (cat: Category, tcg: Tcg) => {
    setOpenTcgId(null);
    setDropdownPos(null);
    const slug = tcgNameToSlug(tcg.name);
    const categoryId = CATEGORY_NAME_MAP[cat.name.toUpperCase()] || cat.name.toLowerCase();

    let href: string;
    if (categoryId === 'singles') {
      href = `/${slug}/singles/search?local=true&pagination=true`;
    } else if (CATEGORY_TO_PATH[categoryId]) {
      const path = CATEGORY_TO_PATH[categoryId];
      href = `/${slug}/${path}/search?local=true&pagination=true`;
    } else {
      const params = new URLSearchParams({
        local: 'true',
        pagination: 'true',
        category: categoryId,
      });
      href = `/${slug}/singles/search?${params.toString()}`;
    }
    push(href);
  };

  const cartItemCount = mounted ? getTotalItems() : 0;
  const siteName = settings.site_name || 'Hydra Collectables';
  const activeCategory = sp.get('category');

  return {
    user,
    isAuthenticated,
    authLoading,
    cartItemCount,
    wishlistCount,
    settings,
    siteName,
    activeTcgs,
    selectedTcg,
    categories:
      openTcgId && categoriesByTcg[openTcgId]?.length > 0
        ? categoriesByTcg[openTcgId]
        : openTcgId && categoriesCache[openTcgId]
          ? categoriesCache[openTcgId]
          : categories,
    catsLoading,
    catsError,
    openTcgId,
    dropdownPos,
    dropdownRef,
    barRef,
    pathname,
    handleTcgClick,
    handleTcgHover,
    handleCategoryClick,
    setOpenTcgId,
    setDropdownPos,
    dispatch,
    mounted,
    activeCategory,
  };
}
