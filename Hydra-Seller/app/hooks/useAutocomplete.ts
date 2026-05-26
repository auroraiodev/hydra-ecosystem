'use client';

import { useReducer, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { searchAPI } from '@/lib/api';

type AutocompleteState = { suggestions: string[]; loading: boolean; error: string | null };

export function useAutocomplete(query: string) {
  const [state, dispatch] = useReducer(
    (s: AutocompleteState, a: Partial<AutocompleteState>): AutocompleteState => ({ ...s, ...a }),
    { suggestions: [], loading: false, error: null }
  );

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      dispatch({ suggestions: [], error: null, loading: false });
      return;
    }

    const fetchSuggestions = async () => {
      dispatch({ loading: true, error: null });

      try {
        const response = await searchAPI.autocomplete(debouncedQuery);

        // Backend returns string[] directly, but apiCall might wrap it
        // Handle both cases: direct array or wrapped response
        if (Array.isArray(response)) {
          dispatch({ suggestions: response });
          return;
        }

        if (response && typeof response === 'object' && 'data' in response) {
          const suggestionsArray = Array.isArray(response.data) ? response.data : [];
          dispatch({ suggestions: suggestionsArray });
          return;
        }

        // If response is an array but not directly, try to extract it
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          Array.isArray(response.data)
        ) {
          dispatch({ suggestions: response.data });
          return;
        }

        dispatch({
          suggestions: [],
          error: response.message || response.error || 'No se pudieron obtener sugerencias',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'No se pudieron obtener sugerencias';
        dispatch({ suggestions: [], error: errorMessage });
      } finally {
        dispatch({ loading: false });
      }
    };

    void fetchSuggestions();
  }, [debouncedQuery]);

  return { suggestions: state.suggestions, loading: state.loading, error: state.error };
}
