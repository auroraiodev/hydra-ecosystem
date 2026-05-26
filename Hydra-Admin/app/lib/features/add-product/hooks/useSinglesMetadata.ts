import { useEffect, useReducer, useCallback } from 'react';
import { conditionsAPI, languagesAPI, tagsAPI } from '@/lib/api';
import { toast } from 'sonner';
import type { Condition, Language } from '../types';

interface MetadataState {
  conditions: Condition[];
  isLoadingConditions: boolean;
  languages: Language[];
  isLoadingLanguages: boolean;
  availableTags: Array<{ id: string; name: string; display_name?: string }>;
  defaultTags: string[];
  isLoadingTags: boolean;
}

type MetadataAction =
  | { type: 'SET_CONDITIONS'; conditions: Condition[] }
  | { type: 'SET_LOADING_CONDITIONS'; loading: boolean }
  | { type: 'SET_LANGUAGES'; languages: Language[] }
  | { type: 'SET_LOADING_LANGUAGES'; loading: boolean }
  | { type: 'SET_TAGS'; available: Array<{ id: string; name: string; display_name?: string }>; defaults: string[] }
  | { type: 'SET_LOADING_TAGS'; loading: boolean };

function metadataReducer(state: MetadataState, action: MetadataAction): MetadataState {
  switch (action.type) {
    case 'SET_CONDITIONS':
      return { ...state, conditions: action.conditions };
    case 'SET_LOADING_CONDITIONS':
      return { ...state, isLoadingConditions: action.loading };
    case 'SET_LANGUAGES':
      return { ...state, languages: action.languages };
    case 'SET_LOADING_LANGUAGES':
      return { ...state, isLoadingLanguages: action.loading };
    case 'SET_TAGS':
      return { ...state, availableTags: action.available, defaultTags: action.defaults };
    case 'SET_LOADING_TAGS':
      return { ...state, isLoadingTags: action.loading };
    default:
      return state;
  }
}

export function useSinglesMetadata() {
  const [state, dispatch] = useReducer(metadataReducer, {
    conditions: [],
    isLoadingConditions: false,
    languages: [],
    isLoadingLanguages: false,
    availableTags: [],
    defaultTags: [],
    isLoadingTags: false,
  });

  const loadConditions = useCallback(async () => {
    dispatch({ type: 'SET_LOADING_CONDITIONS', loading: true });
    try {
      const response = await conditionsAPI.list();
      let conds = Array.isArray(response) ? response : response?.data?.data || response?.data || [];
      if (!Array.isArray(conds)) conds = [conds];

      const activeConds = conds.filter((c: Record<string, unknown>) => c.isActive !== false && c.is_active !== false);
      dispatch({
        type: 'SET_CONDITIONS',
        conditions: activeConds.map((c: Record<string, unknown>) => ({
          id: (c.id as string) || (c._id as string) || '',
          name: (c.name as string) || '',
          displayName: (c.displayName as string) || (c.display_name as string) || (c.name as string) || '',
        })),
      });
    } catch {
      toast.error('Error al cargar condiciones');
    } finally {
      dispatch({ type: 'SET_LOADING_CONDITIONS', loading: false });
    }
  }, []);

  const loadLanguages = useCallback(async () => {
    dispatch({ type: 'SET_LOADING_LANGUAGES', loading: true });
    try {
      const response = await languagesAPI.list();
      let langs = Array.isArray(response) ? response : response?.data?.data || response?.data || [];
      if (!Array.isArray(langs)) langs = [langs];

      const activeLangs = langs.filter((l: Record<string, unknown>) => l.isActive !== false && l.is_active !== false);
      dispatch({
        type: 'SET_LANGUAGES',
        languages: activeLangs.map((l: Record<string, unknown>) => ({
          id: l.id as string,
          name: l.name as string,
          displayName: (l.displayName as string) || (l.display_name as string) || (l.name as string),
        })),
      });
    } catch {
      toast.error('Error al cargar idiomas');
    } finally {
      dispatch({ type: 'SET_LOADING_LANGUAGES', loading: false });
    }
  }, []);

  const loadTags = useCallback(async () => {
    dispatch({ type: 'SET_LOADING_TAGS', loading: true });
    try {
      const [defaultRes, activeRes] = await Promise.allSettled([
        tagsAPI.getDefault(),
        tagsAPI.getActive(),
      ]);

      let defaults: string[] = ['Commander', 'Personal', 'Reestock', 'cEDH Staple'];
      if (defaultRes.status === 'fulfilled') {
        const data = Array.isArray(defaultRes.value) ? defaultRes.value : defaultRes.value?.data || [];
        if (data.length > 0) defaults = data.map((t: Record<string, unknown>) => (t.name as string) || (t.display_name as string) || '');
      }

      let available: Array<{ id: string; name: string; display_name?: string }> = [];
      if (activeRes.status === 'fulfilled') {
        const data = Array.isArray(activeRes.value) ? activeRes.value : activeRes.value?.data || [];
        available = data.map((t: Record<string, unknown>) => ({
          id: (t.id as string) || '',
          name: (t.name as string) || '',
          display_name: (t.display_name as string) || (t.name as string),
        }));
      }

      dispatch({ type: 'SET_TAGS', available, defaults });
    } catch {
      // ignore
    } finally {
      dispatch({ type: 'SET_LOADING_TAGS', loading: false });
    }
  }, []);

  useEffect(() => {
    void loadConditions();
    void loadLanguages();
    void loadTags();
  }, [loadConditions, loadLanguages, loadTags]);

  return state;
}
