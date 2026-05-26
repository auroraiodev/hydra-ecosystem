'use client';

import { useEffect, useReducer } from 'react';
import type { RecentlyViewedItem } from '../types';
import { RECENTLY_VIEWED_KEY } from '../constants';

interface RecentlyViewedState {
  data: RecentlyViewedItem[];
  isLoaded: boolean;
}

type RecentlyViewedAction =
  | { type: 'SET_DATA'; payload: RecentlyViewedItem[] }
  | { type: 'SET_DATA_AND_LOADED'; payload: RecentlyViewedItem[] }
  | { type: 'SET_LOADED' };

function recentlyViewedReducer(
  state: RecentlyViewedState,
  action: RecentlyViewedAction
): RecentlyViewedState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'SET_DATA_AND_LOADED':
      return { data: action.payload, isLoaded: true };
    case 'SET_LOADED':
      return { ...state, isLoaded: true };
    default:
      return state;
  }
}

export function useRecentlyViewed() {
  const [{ data: recentlyViewed, isLoaded }, dispatch] = useReducer(recentlyViewedReducer, {
    data: [],
    isLoaded: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as RecentlyViewedItem[];
          const sorted = parsed.sort((a, b) => b.viewedAt - a.viewedAt).slice(0, 20);
          dispatch({ type: 'SET_DATA_AND_LOADED', payload: sorted });
        } catch (error) {
          console.error('Error parsing recently viewed from localStorage:', error);
          localStorage.removeItem(RECENTLY_VIEWED_KEY);
          dispatch({ type: 'SET_LOADED' });
        }
      } else {
        dispatch({ type: 'SET_LOADED' });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const addToRecentlyViewed = (item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    dispatch({
      type: 'SET_DATA',
      payload: (() => {
        const newItem: RecentlyViewedItem = {
          ...item,
          viewedAt: Date.now(),
        };

        const filtered = recentlyViewed.filter((viewedItem) => viewedItem.id !== item.id);
        const updated = [newItem, ...filtered].sort((a, b) => b.viewedAt - a.viewedAt).slice(0, 20);

        try {
          localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error('Error saving recently viewed to localStorage:', error);
        }

        return updated;
      })(),
    });
  };

  const removeFromRecentlyViewed = (productId: string) => {
    const updated = recentlyViewed.filter((item) => item.id !== productId);
    dispatch({ type: 'SET_DATA', payload: updated });
    try {
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recently viewed to localStorage:', error);
    }
  };

  const clearRecentlyViewed = () => {
    dispatch({ type: 'SET_DATA', payload: [] });
    try {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
    } catch (error) {
      console.error('Error clearing recently viewed from localStorage:', error);
    }
  };

  const isRecentlyViewed = (productId: string) =>
    recentlyViewed.some((item) => item.id === productId);

  return {
    recentlyViewed,
    isLoaded,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed,
    isRecentlyViewed,
    count: recentlyViewed.length,
  };
}
