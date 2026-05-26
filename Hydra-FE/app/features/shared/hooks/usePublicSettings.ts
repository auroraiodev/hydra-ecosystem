'use client';

import { useEffect, useReducer } from 'react';
import { getPublicSettings, PublicSettings } from '@/lib/api/settings';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { setPublicSettings } from '@/lib/store/slices/settingsSlice';

// Module-level promise to deduplicate concurrent fetches across component instances
let settingsPromise: Promise<PublicSettings> | null = null;

export function usePublicSettings() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings.public);
  const isInitialized = useAppSelector((state) => state.settings.isInitialized);
  const [{ loading }, loadingDispatch] = useReducer(
    (_prev: { loading: boolean }, action: { type: 'SET_LOADING'; payload: boolean }) => {
      switch (action.type) {
        case 'SET_LOADING':
          return { loading: action.payload };
        default:
          return _prev;
      }
    },
    { loading: !isInitialized }
  );

  useEffect(() => {
    if (isInitialized) {
      void Promise.resolve().then(() => loadingDispatch({ type: 'SET_LOADING', payload: false }));
      return;
    }

    let cancelled = false;

    async function fetchSettings() {
      try {
        // Reuse existing promise if another component is already fetching
        if (!settingsPromise) {
          settingsPromise = getPublicSettings();
        }
        const data = await settingsPromise;
        if (!cancelled && data && Object.keys(data).length > 0) {
          dispatch(setPublicSettings(data));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error in usePublicSettings hook:', error);
        }
      } finally {
        if (!cancelled) {
          loadingDispatch({ type: 'SET_LOADING', payload: false });
        }
        settingsPromise = null;
      }
    }

    void Promise.resolve().then(() => fetchSettings());

    return () => {
      cancelled = true;
    };
  }, [isInitialized, dispatch, loadingDispatch]);

  return { settings, loading };
}
