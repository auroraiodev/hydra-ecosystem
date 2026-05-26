'use client';

import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/features/shared';
import { API_URL } from '@/lib/constants/api';

import { type UseAutocompleteOptions } from '../types';

export function useAutocomplete(query: string, options: UseAutocompleteOptions = {}) {
  const { searchType = 'singles', enabled = true } = options;

  const debouncedQuery = useDebounce(query, 300);

  const { data: suggestions = [], isLoading: loading } = useQuery<string[]>({
    queryKey: ['autocomplete', debouncedQuery, searchType],
    queryFn: async () => {
      const endpoint = `${API_URL}/search/autocomplete?query=${encodeURIComponent(debouncedQuery)}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const suggestionsArray = Array.isArray(data) ? data : data?.data || [];

      console.log(
        `[AUTOCOMPLETE:${searchType}] Received`,
        suggestionsArray.length,
        'suggestions for:',
        debouncedQuery
      );

      return suggestionsArray;
    },
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
  });

  return { suggestions, loading, error: null };
}
