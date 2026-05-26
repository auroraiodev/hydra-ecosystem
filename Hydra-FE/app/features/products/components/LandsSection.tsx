'use client';

import { useEffect, useMemo, useRef, useReducer } from 'react';
import { searchLocal } from '@/features/search-filters/utils';
import { searchResultsToCardData } from '@/lib/utils/transformers';
import type { SearchResult } from '@/lib/types';
import { ProductSection } from './ProductSection';
import type { LucideIcon } from 'lucide-react';
import { Zap, Sparkles } from 'lucide-react';

// ─── Land Lists ───────────────────────────────────────────────────────────────

const SHOCKLANDS = [
  'Hallowed Fountain',
  'Watery Grave',
  'Blood Crypt',
  'Stomping Ground',
  'Temple Garden',
  'Godless Shrine',
  'Steam Vents',
  'Overgrown Tomb',
  'Sacred Foundry',
  'Breeding Pool',
];

const FETCHLANDS = [
  'Flooded Strand',
  'Polluted Delta',
  'Bloodstained Mire',
  'Wooded Foothills',
  'Windswept Heath',
  'Marsh Flats',
  'Scalding Tarn',
  'Verdant Catacombs',
  'Arid Mesa',
  'Misty Rainforest',
];

const SHOCK_URL = `/singles/search?q=${encodeURIComponent(SHOCKLANDS.join(' '))}`;
const FETCH_URL = `/singles/search?q=${encodeURIComponent(FETCHLANDS.join(' '))}`;

// Search each name individually (backend `contains` doesn't support OR lists).
// Sequential with early exit: stops as soon as 4 in-stock results are found
// to avoid hammering the rate limiter with 20 parallel requests.
async function searchLandGroup(names: string[]): Promise<SearchResult[]> {
  const seen = new Set<string>();
  const combined: SearchResult[] = [];

  const results = await Promise.all(
    names.map(async (name) => {
      try {
        return await searchLocal({ q: name, limit: 5, paginate: false });
      } catch {
        return null;
      }
    })
  );
  for (const result of results) {
    if (combined.length >= 4) break;
    if (!result?.success) continue;
    for (const item of result.data) {
      if (item.id && !seen.has(item.id) && item.stock > 0) {
        seen.add(item.id);
        combined.push(item);
      }
      if (combined.length >= 4) break;
    }
  }

  return combined;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface LandsState {
  shockResults: SearchResult[];
  shockLoading: boolean;
  fetchResults: SearchResult[];
  fetchLoading: boolean;
}

type LandsAction =
  | { type: 'SET_SHOCKS'; payload: SearchResult[] }
  | { type: 'SET_FETCHES'; payload: SearchResult[] }
  | { type: 'DONE' };

function landsReducer(state: LandsState, action: LandsAction): LandsState {
  switch (action.type) {
    case 'SET_SHOCKS':
      return { ...state, shockResults: action.payload, shockLoading: false };
    case 'SET_FETCHES':
      return { ...state, fetchResults: action.payload, fetchLoading: false };
    case 'DONE':
      return { ...state, shockLoading: false, fetchLoading: false };
    default:
      return state;
  }
}

export function LandsSection({ className = '' }: { className?: string }) {
  const [landsState, landsDispatch] = useReducer(landsReducer, {
    shockResults: [],
    shockLoading: true,
    fetchResults: [],
    fetchLoading: true,
  });
  const { shockResults, shockLoading, fetchResults, fetchLoading } = landsState;
  const isMounted = useRef(false);

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    const fetchLands = async () => {
      // Fetch in parallel to speed up first load, but backend limit is now 300
      try {
        const shocks = await searchLandGroup(SHOCKLANDS);
        landsDispatch({ type: 'SET_SHOCKS', payload: shocks });

        const fetches = await searchLandGroup(FETCHLANDS);
        landsDispatch({ type: 'SET_FETCHES', payload: fetches });
      } catch {
        landsDispatch({ type: 'DONE' });
      }
    };

    fetchLands();
  }, []);

  const shockCards = useMemo(
    () => searchResultsToCardData(shockResults, { suffix: 'shocks' }),
    [shockResults]
  );

  const fetchCards = useMemo(
    () => searchResultsToCardData(fetchResults, { suffix: 'fetches' }),
    [fetchResults]
  );

  const showShocks = shockLoading || shockCards.length > 0;
  const showFetches = fetchLoading || fetchCards.length > 0;

  if (!showShocks && !showFetches) return null;

  return (
    <>
      {showShocks && (
        <ProductSection
          title="Shocklands"
          href={SHOCK_URL}
          cards={shockCards}
          loading={shockLoading}
          className={className}
          icon={Zap as LucideIcon}
        />
      )}
      {showFetches && (
        <ProductSection
          title="Fetchlands"
          href={FETCH_URL}
          cards={fetchCards}
          loading={fetchLoading}
          className={className}
          icon={Sparkles as LucideIcon}
        />
      )}
    </>
  );
}
