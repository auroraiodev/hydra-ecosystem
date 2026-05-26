'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/lib/store/hooks';
import {
  setInitialTcgs,
  setInitialCategories,
  setInitialBanners,
} from '@/lib/store/slices/gameSlice';
import { setPublicSettings } from '@/lib/store/slices/settingsSlice';
import type { Tcg } from '@/lib/types/tcg';
import type { Banner } from '@/lib/api/banners';
import type { Category } from '@/lib/api/categories';
import type { PublicSettings } from '@/lib/api/settings';

const EMPTY_CATEGORIES: Record<string, Category[]> = {};
const EMPTY_BANNERS: Record<string, Banner[]> = {};

interface ReduxHydratorProps {
  tcgs: Tcg[];
  categories?: Record<string, Category[]>;
  banners?: Record<string, Banner[]>;
  settings?: PublicSettings;
}

export function ReduxHydrator({
  tcgs,
  categories = EMPTY_CATEGORIES,
  banners = EMPTY_BANNERS,
  settings,
}: ReduxHydratorProps) {
  const dispatch = useAppDispatch();
  const prevTcgs = useRef<Tcg[]>([]);
  const prevCategories = useRef<Record<string, Category[]>>({});
  const prevBanners = useRef<Record<string, Banner[]>>({});
  const prevSettings = useRef<PublicSettings | undefined>(undefined);

  useEffect(() => {
    if (tcgs.length > 0 && tcgs !== prevTcgs.current) {
      dispatch(setInitialTcgs(tcgs));
      prevTcgs.current = tcgs;
    }
  }, [dispatch, tcgs]);

  useEffect(() => {
    if (Object.keys(categories).length > 0 && categories !== prevCategories.current) {
      dispatch(setInitialCategories(categories));
      prevCategories.current = categories;
    }
  }, [dispatch, categories]);

  useEffect(() => {
    if (Object.keys(banners).length > 0 && banners !== prevBanners.current) {
      dispatch(setInitialBanners(banners));
      prevBanners.current = banners;
    }
  }, [dispatch, banners]);

  useEffect(() => {
    if (settings && settings !== prevSettings.current) {
      dispatch(setPublicSettings(settings));
      prevSettings.current = settings;
    }
  }, [dispatch, settings]);

  return null;
}
