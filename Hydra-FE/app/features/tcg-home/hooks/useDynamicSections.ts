import { useEffect, useReducer } from 'react';
import { getActiveCategories } from '@/lib/api/categories';
import { searchLocal } from '@/lib/api';
import { searchResultsToCardData } from '@/lib/utils/transformers';
import type { CardData } from '@/features/products/types';
import { logger } from '@/lib/utils/logger';
import { CATEGORY_TO_PATH } from '@/features/search-filters/constants';

interface SectionData {
  title: string;
  href: string;
  cards: CardData[];
  category: string;
}

interface SectionsState {
  sections: SectionData[];
  loading: boolean;
}

type SectionsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: SectionData[] }
  | { type: 'FETCH_END' };

function sectionsReducer(state: SectionsState, action: SectionsAction): SectionsState {
  switch (action.type) {
    case 'FETCH_START':
      return { sections: [], loading: true };
    case 'FETCH_SUCCESS':
      return { sections: action.payload, loading: false };
    case 'FETCH_END':
      return { ...state, loading: false };
    default:
      return state;
  }
}

export function useDynamicSections(tcgId: string, tcgSlug: string) {
  const [{ sections, loading }, dispatch] = useReducer(sectionsReducer, {
    sections: [],
    loading: true,
  });

  useEffect(() => {
    if (!tcgId) return;

    const abortController = new AbortController();
    const signal = abortController.signal;

    async function fetchDynamicSections() {
      try {
        dispatch({ type: 'FETCH_START' });

        const categories = await getActiveCategories(tcgId);
        if (signal.aborted || categories.length === 0) {
          dispatch({ type: 'FETCH_END' });
          return;
        }

        // Fetch all categories in parallel, preserve the API-defined order
        const results = await Promise.all(
          categories.map(async (cat) => {
            try {
              const res = await searchLocal(
                { tcgId, category: cat.name, limit: 12 },
                { revalidate: 1200, signal }
              );
              if (signal.aborted || !res.success || res.data.length === 0) return null;

              const path = CATEGORY_TO_PATH[cat.name] ?? cat.name.toLowerCase().replace(/_/g, '-');

              return {
                title: cat.display_name || cat.name,
                href: `/${tcgSlug}/${path}/search?local=true&tcgId=${tcgId}&pagination=true`,
                cards: searchResultsToCardData(res.data, { suffix: cat.name }),
                category: cat.name,
              } satisfies SectionData;
            } catch {
              return null;
            }
          })
        );

        if (signal.aborted) return;
        dispatch({
          type: 'FETCH_SUCCESS',
          payload: results.filter((s): s is SectionData => s !== null),
        });
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        logger.error('Error fetching dynamic sections:', error);
      } finally {
        if (!signal.aborted) dispatch({ type: 'FETCH_END' });
      }
    }

    void fetchDynamicSections();

    return () => abortController.abort();
  }, [tcgId, tcgSlug, dispatch]);

  return { sections, loading };
}
