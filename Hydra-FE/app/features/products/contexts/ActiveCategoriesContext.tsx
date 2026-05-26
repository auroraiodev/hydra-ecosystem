'use client';

import { createContext, use, useState, useCallback, type ReactNode } from 'react';
import type { ActiveCategoriesState, ActiveCategoriesContextType } from '../types';

const ActiveCategoriesContext = createContext<ActiveCategoriesContextType>({
  hasSingles: undefined,
  hasBundles: undefined,
  hasPreconDecks: undefined,
  hasMicas: undefined,
  hasCommander: undefined,
  setActiveCategories: () => {},
});

export function ActiveCategoriesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActiveCategoriesState>({
    hasSingles: undefined,
    hasBundles: undefined,
    hasPreconDecks: undefined,
    hasMicas: undefined,
    hasCommander: undefined,
  });

  const setActiveCategories = useCallback((partial: Partial<ActiveCategoriesState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <ActiveCategoriesContext.Provider value={{ ...state, setActiveCategories }}>
      {children}
    </ActiveCategoriesContext.Provider>
  );
}

export function useActiveCategories() {
  return use(ActiveCategoriesContext);
}
