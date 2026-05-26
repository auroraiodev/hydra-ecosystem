'use client';

import { useReducer, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { searchAPI } from '@/lib/api';

type AutocompleteState = { suggestions: string[]; loading: boolean; error: string | null };

type AutocompleteAction =
  | { type: 'RESET' }
  | { type: 'SET_LOADING' }
  | { type: 'SET_SUGGESTIONS'; suggestions: string[] }
  | { type: 'SET_ERROR'; error: string };

function autocompleteReducer(state: AutocompleteState, action: AutocompleteAction): AutocompleteState {
  switch (action.type) {
    case 'RESET':
      return { suggestions: [], loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_SUGGESTIONS':
      return { suggestions: action.suggestions, loading: false, error: null };
    case 'SET_ERROR':
      return { suggestions: [], loading: false, error: action.error };
    default:
      return state;
  }
}

export function useAutocomplete(query: string) {
  const [state, dispatch] = useReducer(autocompleteReducer, {
    suggestions: [],
    loading: false,
    error: null,
  });

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      dispatch({ type: 'RESET' });
      return;
    }

    const fetchSuggestions = async () => {
      dispatch({ type: 'SET_LOADING' });

      try {
        const response = await searchAPI.autocomplete(debouncedQuery);

        if (Array.isArray(response)) {
          dispatch({ type: 'SET_SUGGESTIONS', suggestions: response });
          return;
        }

        if (response && typeof response === 'object' && 'data' in response) {
          const suggestionsArray = Array.isArray(response.data) ? response.data : [];
          dispatch({ type: 'SET_SUGGESTIONS', suggestions: suggestionsArray });
          return;
        }

        dispatch({ type: 'SET_ERROR', error: response?.message || response?.error || 'No se pudieron obtener sugerencias' });
      } catch {
        dispatch({ type: 'SET_ERROR', error: 'No se pudieron obtener sugerencias' });
      }
    };

    void fetchSuggestions();
  }, [debouncedQuery]);

  return { suggestions: state.suggestions, loading: state.loading, error: state.error };
}
