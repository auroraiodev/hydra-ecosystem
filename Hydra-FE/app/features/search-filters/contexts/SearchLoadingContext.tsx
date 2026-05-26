'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useTransition,
  Suspense,
  use,
  type ReactNode,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface SearchLoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
}

const SearchLoadingContext = createContext<SearchLoadingContextType>({
  isLoading: false,
  startLoading: () => {},
});

/** Watches route changes and stops the loading state when navigation completes. */
function NavigationWatcher({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onNavigateRef.current();
  }, [pathname, searchParams]);

  return null;
}

export function SearchLoadingProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();

  const startLoading = useCallback(() => startTransition(() => {}), [startTransition]);

  return (
    <SearchLoadingContext.Provider value={{ isLoading: isPending, startLoading }}>
      <Suspense fallback={null}>
        <NavigationWatcher onNavigate={() => startTransition(() => {})} />
      </Suspense>
      {children}
    </SearchLoadingContext.Provider>
  );
}

export const useSearchLoading = () => use(SearchLoadingContext);
