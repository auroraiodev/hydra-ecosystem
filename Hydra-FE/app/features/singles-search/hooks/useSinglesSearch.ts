'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants/api';
import type { HybridSearchResult, HybridSearchResponse } from '../types';
import type { SearchPagination } from '@/lib/types';
import type { ReadonlyURLSearchParams } from 'next/navigation';

const EMPTY_RESULTS: HybridSearchResult[] = [];

export function useSinglesSearch(
  searchParams: ReadonlyURLSearchParams,
  forcedExpansion?: string,
  forcedCategory?: string,
  initialResults: HybridSearchResult[] = EMPTY_RESULTS,
  initialPagination: SearchPagination | null = null,
  tcgSlug?: string
) {
  const sp = searchParams;

  const query = sp.get('query') || '';
  const localParam = sp.get('local') === 'true' || !!forcedExpansion;
  const paginationParam = sp.get('pagination') === 'true' || !!forcedExpansion;
  const metadataParam = sp.get('metadata') || undefined;
  const categoryParam = sp.get('category') || forcedCategory || undefined;
  const expansionParam = forcedExpansion || sp.get('expansion') || undefined;
  const tcgIdParam = sp.get('tcgId') || undefined;
  const currentPage = parseInt(sp.get('page') || '1', 10);

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const { replace } = useRouter();

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: [
      'singles-search',
      debouncedQuery,
      currentPage,
      localParam,
      paginationParam,
      metadataParam,
      categoryParam,
      expansionParam,
      tcgIdParam,
      tcgSlug,
    ],
    queryFn: async ({ signal }) => {
      if (!localParam && (!debouncedQuery || debouncedQuery.trim().length < 2)) {
        return {
          results: [],
          pagination: null,
          counts: null,
        };
      }

      let url: string;
      const isKeywordSearch = !!debouncedQuery;
      const isMagic = !tcgSlug || tcgSlug === 'mtg';

      const clientBase = typeof window !== 'undefined' ? window.location.origin : undefined;
      if ((localParam && !isKeywordSearch) || (isKeywordSearch && !isMagic)) {
        const baseUrl = new URL(`${API_URL}/search/local`, clientBase);
        baseUrl.searchParams.set('limit', '12');
        baseUrl.searchParams.set('page', currentPage.toString());
        baseUrl.searchParams.set('paginate', paginationParam.toString());
        if (metadataParam) baseUrl.searchParams.set('metadata', metadataParam);
        if (categoryParam) baseUrl.searchParams.set('category', categoryParam);
        if (expansionParam) baseUrl.searchParams.set('expansion', expansionParam);
        if (tcgIdParam) baseUrl.searchParams.set('tcgId', tcgIdParam);
        url = baseUrl.toString();
      } else {
        const baseUrl = new URL(`${API_URL}/search/hybrid`, clientBase);
        baseUrl.searchParams.set('q', debouncedQuery);
        baseUrl.searchParams.set('page', currentPage.toString());
        baseUrl.searchParams.set('limit', '12');
        if (tcgIdParam) baseUrl.searchParams.set('tcgId', tcgIdParam);
        if (categoryParam) baseUrl.searchParams.set('category', categoryParam);
        if (expansionParam) baseUrl.searchParams.set('expansions', expansionParam);
        url = baseUrl.toString();
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: HybridSearchResponse = await response.json();

      if (data.success && data.data) {
        const filtered = data.data.filter(
          (r: HybridSearchResult) => !r.isLocalInventory || r.stock > 0
        );

        if (filtered.length === 0 && categoryParam && currentPage === 1) {
          replace('/');
        }

        return {
          results: filtered,
          pagination: data.pagination ?? null,
          counts: { local: data.localCount, importation: data.importationCount },
        };
      }

      if (categoryParam && currentPage === 1) replace('/');
      return { results: [], pagination: null, counts: null };
    },
    staleTime: 60000,
  });

  const results = data?.results ?? initialResults;
  const pagination = data?.pagination ?? initialPagination;
  const counts = data?.counts ?? null;
  const error = queryError ? (queryError as Error).message : null;

  return {
    results,
    loading,
    error,
    pagination,
    counts,
    query,
    currentPage,
    localParam,
    categoryParam,
    metadataParam,
    expansionParam,
    tcgIdParam,
  };
}
