'use client';

import { useEffect, useRef, useReducer } from 'react';
import { getActiveBanners, type Banner } from '@/lib/api/banners';
import { logger } from '@/lib/utils/logger';

export interface BannerSlide {
  id: string;
  image_url: string;
  mobile_image_url?: string;
  link_url: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

interface BannersState {
  banners: BannerSlide[];
  isLoading: boolean;
  error: string | null;
}

type BannersAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: BannerSlide[] }
  | { type: 'FETCH_ERROR'; payload: string };

function bannersReducer(state: BannersState, action: BannersAction): BannersState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true };
    case 'FETCH_SUCCESS':
      return { banners: action.payload, isLoading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
}

export function useBanners(tcgId: string) {
  const [state, dispatch] = useReducer(bannersReducer, {
    banners: [],
    isLoading: true,
    error: null,
  });
  const { banners, isLoading, error } = state;
  const fetchedForTcgId = useRef<string | null>(null);

  useEffect(() => {
    const isGlobal = !tcgId || tcgId === 'global';
    const effectiveTcgId = isGlobal ? undefined : tcgId;
    const fetchKey = isGlobal ? 'global' : tcgId;

    if (fetchedForTcgId.current === fetchKey) return;
    fetchedForTcgId.current = fetchKey;

    async function fetchBanners() {
      try {
        dispatch({ type: 'FETCH_START' });
        const data = await getActiveBanners(effectiveTcgId);

        const slides: BannerSlide[] = data.map((banner: Banner) => ({
          id: banner.id,
          image_url: banner.desktop_image,
          mobile_image_url: banner.mobile_image || undefined,
          link_url: banner.button_link || '#',
          title: banner.title,
          subtitle: banner.subtitle || '',
          description: banner.description || '',
        }));

        dispatch({ type: 'FETCH_SUCCESS', payload: slides });
      } catch (err) {
        logger.error(`Error fetching banners for TCG ${tcgId}:`, err);
        dispatch({
          type: 'FETCH_ERROR',
          payload: err instanceof Error ? err.message : 'Error loading banners',
        });
      }
    }

    fetchBanners();
  }, [tcgId, dispatch]);

  return { banners, isLoading, error };
}
