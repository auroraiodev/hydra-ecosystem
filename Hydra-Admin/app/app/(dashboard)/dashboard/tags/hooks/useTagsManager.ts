'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { tagsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Tag {
  id: string;
  name: string;
  display_name?: string;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TagFormData {
  name: string;
  display_name: string;
  is_default: boolean;
  is_active: boolean;
}

const emptyTagForm = (): TagFormData => ({
  name: '',
  display_name: '',
  is_default: false,
  is_active: true,
});

interface TagsContentState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  isSubmitting: boolean;
  dialog: {
    isOpen: boolean;
    editingTag: Tag | null;
    formData: TagFormData;
  };
}

const initialTagsContentState: TagsContentState = {
  tags: [],
  isLoading: true,
  error: null,
  searchTerm: '',
  isSubmitting: false,
  dialog: {
    isOpen: false,
    editingTag: null,
    formData: emptyTagForm(),
  },
};

type TagsContentAction =
  | { type: 'SET_TAGS'; tags: Tag[] }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_SEARCH_TERM'; searchTerm: string }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT'; tag: Tag }
  | { type: 'SET_DIALOG_FORM'; data: Partial<TagFormData> }
  | { type: 'CLOSE_DIALOG' };

function tagsContentReducer(state: TagsContentState, action: TagsContentAction): TagsContentState {
  switch (action.type) {
    case 'SET_TAGS': return { ...state, tags: action.tags };
    case 'SET_LOADING': return { ...state, isLoading: action.isLoading };
    case 'SET_ERROR': return { ...state, error: action.error };
    case 'SET_SEARCH_TERM': return { ...state, searchTerm: action.searchTerm };
    case 'SET_SUBMITTING': return { ...state, isSubmitting: action.isSubmitting };
    case 'OPEN_CREATE':
      return { ...state, dialog: { isOpen: true, editingTag: null, formData: emptyTagForm() } };
    case 'OPEN_EDIT':
      return {
        ...state,
        dialog: {
          isOpen: true,
          editingTag: action.tag,
          formData: {
            name: action.tag.name,
            display_name: action.tag.display_name || action.tag.name,
            is_default: action.tag.is_default,
            is_active: action.tag.is_active,
          },
        },
      };
    case 'SET_DIALOG_FORM':
      return { ...state, dialog: { ...state.dialog, formData: { ...state.dialog.formData, ...action.data } } };
    case 'CLOSE_DIALOG':
      return { ...state, dialog: { ...state.dialog, isOpen: false } };
    default: return state;
  }
}

export function useTagsManager() {
  const [state, dispatch] = useReducer(tagsContentReducer, initialTagsContentState);

  const fetchTags = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    try {
      const response = await tagsAPI.list();
      let tagsArray: Tag[] = [];
      if (Array.isArray(response)) tagsArray = response;
      else if (response?.data && Array.isArray(response.data)) tagsArray = response.data;
      dispatch({ type: 'SET_TAGS', tags: tagsArray });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load tags';
      dispatch({ type: 'SET_ERROR', error: msg });
      toast.error(msg);
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, []);

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
    try {
      if (state.dialog.editingTag) {
        await tagsAPI.update(state.dialog.editingTag.id, state.dialog.formData);
        toast.success('Tag updated');
      } else {
        await tagsAPI.create(state.dialog.formData);
        toast.success('Tag created');
      }
      dispatch({ type: 'CLOSE_DIALOG' });
      void fetchTags();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save tag');
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await tagsAPI.delete(id);
      toast.success('Tag deleted');
      void fetchTags();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete tag');
    }
  };

  const filteredTags = state.tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (tag.display_name?.toLowerCase().includes(state.searchTerm.toLowerCase()) ?? false)
  );

  return {
    state,
    dispatch,
    fetchTags,
    handleSubmit,
    handleDelete,
    filteredTags,
  };
}
