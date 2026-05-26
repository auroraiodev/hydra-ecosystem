import { useEffect, useReducer, useCallback } from 'react';
import { conditionsAPI, languagesAPI, categoriesAPI } from '@/lib/api';
import { toast } from 'sonner';

interface MetadataItem {
  id: string;
  name: string;
  display_name?: string;
  displayName?: string;
}

interface MetadataState {
  conditions: MetadataItem[];
  isLoadingConditions: boolean;
  languages: MetadataItem[];
  isLoadingLanguages: boolean;
  categories: MetadataItem[];
  isLoadingCategories: boolean;
}

type MetadataAction =
  | { type: 'SET_CONDITIONS'; items: MetadataItem[] }
  | { type: 'SET_LOADING_CONDITIONS'; loading: boolean }
  | { type: 'SET_LANGUAGES'; items: MetadataItem[] }
  | { type: 'SET_LOADING_LANGUAGES'; loading: boolean }
  | { type: 'SET_CATEGORIES'; items: MetadataItem[] }
  | { type: 'SET_LOADING_CATEGORIES'; loading: boolean };

function metadataReducer(state: MetadataState, action: MetadataAction): MetadataState {
  switch (action.type) {
    case 'SET_CONDITIONS': return { ...state, conditions: action.items };
    case 'SET_LOADING_CONDITIONS': return { ...state, isLoadingConditions: action.loading };
    case 'SET_LANGUAGES': return { ...state, languages: action.items };
    case 'SET_LOADING_LANGUAGES': return { ...state, isLoadingLanguages: action.loading };
    case 'SET_CATEGORIES': return { ...state, categories: action.items };
    case 'SET_LOADING_CATEGORIES': return { ...state, isLoadingCategories: action.loading };
    default: return state;
  }
}

export function useProductMetadata() {
  const [state, dispatch] = useReducer(metadataReducer, {
    conditions: [],
    isLoadingConditions: false,
    languages: [],
    isLoadingLanguages: false,
    categories: [],
    isLoadingCategories: false,
  });

  const getArray = (res: unknown): MetadataItem[] => {
    if (Array.isArray(res)) return res as MetadataItem[];
    const r = res as Record<string, unknown>;
    if (r?.data && Array.isArray(r.data)) return r.data as MetadataItem[];
    const rd = r?.data as Record<string, unknown>;
    if (rd?.data && Array.isArray(rd.data)) return rd.data as MetadataItem[];
    return [];
  };

  const fetchMetadata = useCallback(async () => {
    dispatch({ type: 'SET_LOADING_CONDITIONS', loading: true });
    dispatch({ type: 'SET_LOADING_LANGUAGES', loading: true });
    dispatch({ type: 'SET_LOADING_CATEGORIES', loading: true });

    try {
      const [cRes, lRes, catRes] = await Promise.all([
        conditionsAPI.list(),
        languagesAPI.list(),
        categoriesAPI.list(),
      ]);

      dispatch({ type: 'SET_CONDITIONS', items: getArray(cRes) });
      dispatch({ type: 'SET_LANGUAGES', items: getArray(lRes) });
      dispatch({ type: 'SET_CATEGORIES', items: getArray(catRes) });
    } catch {
      toast.error('Error al cargar metadatos de productos');
    } finally {
      dispatch({ type: 'SET_LOADING_CONDITIONS', loading: false });
      dispatch({ type: 'SET_LOADING_LANGUAGES', loading: false });
      dispatch({ type: 'SET_LOADING_CATEGORIES', loading: false });
    }
  }, []);

  useEffect(() => {
    void fetchMetadata();
  }, [fetchMetadata]);

  return { ...state, refresh: fetchMetadata };
}
