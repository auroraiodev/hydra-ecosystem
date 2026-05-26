'use client';

import type { Product, ApiProduct } from './types';

export interface ProductsState {
  products: Product[];
  apiProducts: ApiProduct[];
  isLoading: boolean;
  error: string | null;
  isDeleting: boolean;
  total: number;
  totalPages: number;
  sortField: keyof Product;
  sortDirection: 'asc' | 'desc';
  tcgs: { id: string; name: string; display_name?: string }[];
  conditions: { id: string; name: string; display_name?: string }[];
  categories: { id: string; name: string; display_name?: string }[];
  updatingStock: Set<string>;
  updatingCondition: Set<string>;
  updatingOwner: Set<string>;
  updatingLanguage: Set<string>;
  users: { id: string; email: string; firstName?: string; lastName?: string }[];
  languages: { id: string; name: string; display_name?: string }[];
  searchTerm: string;
  debouncedSearch: string;
  page: number;
  limit: number;
  isAddOpen: boolean;
  activeTab: string;
  hideOutOfStock: boolean;
  ownerFilter: string;
  ownerOpen: boolean;
  selectedTcg: string;
  selectedIds: Set<string>;
}

export type ProductsAction =
  | { type: 'SET_PRODUCTS'; products: Product[] }
  | { type: 'SET_API_PRODUCTS'; products: ApiProduct[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_DELETING'; deleting: boolean }
  | { type: 'SET_PAGINATION'; total: number; totalPages: number }
  | { type: 'SET_SORT'; field: keyof Product; direction?: 'asc' | 'desc' }
  | { type: 'SET_TCGS'; tcgs: { id: string; name: string; display_name?: string }[] }
  | { type: 'SET_CONDITIONS'; conditions: { id: string; name: string; display_name?: string }[] }
  | { type: 'SET_CATEGORIES'; categories: { id: string; name: string; display_name?: string }[] }
  | { type: 'SET_USERS'; users: { id: string; email: string; firstName?: string; lastName?: string }[] }
  | { type: 'SET_LANGUAGES'; languages: { id: string; name: string; display_name?: string }[] }
  | { type: 'SET_UPDATING'; key: 'Stock' | 'Condition' | 'Owner' | 'Language'; id: string; isUpdating: boolean }
  | { type: 'SET_SEARCH'; term: string }
  | { type: 'SET_DEBOUNCED_SEARCH'; term: string }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'SET_LIMIT'; limit: number }
  | { type: 'SET_ADD_OPEN'; open: boolean }
  | { type: 'SET_ACTIVE_TAB'; tab: string }
  | { type: 'SET_HIDE_OUT_OF_STOCK'; hide: boolean }
  | { type: 'SET_OWNER_FILTER'; filter: string }
  | { type: 'SET_OWNER_OPEN'; open: boolean }
  | { type: 'SET_SELECTED_TCG'; tcg: string }
  | { type: 'TOGGLE_SELECT'; id: string }
  | { type: 'TOGGLE_SELECT_ALL' }
  | { type: 'CLEAR_SELECTION' };

export function productsReducer(state: ProductsState, action: ProductsAction): ProductsState {
  switch (action.type) {
    case 'SET_PRODUCTS': return { ...state, products: action.products };
    case 'SET_API_PRODUCTS': return { ...state, apiProducts: action.products };
    case 'SET_LOADING': return { ...state, isLoading: action.loading };
    case 'SET_ERROR': return { ...state, error: action.error };
    case 'SET_DELETING': return { ...state, isDeleting: action.deleting };
    case 'SET_PAGINATION': return { ...state, total: action.total, totalPages: action.totalPages };
    case 'SET_SORT':
      return {
        ...state,
        sortField: action.field,
        sortDirection: action.direction || (state.sortField === action.field ? (state.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc'),
      };
    case 'SET_TCGS': return { ...state, tcgs: action.tcgs };
    case 'SET_CONDITIONS': return { ...state, conditions: action.conditions };
    case 'SET_CATEGORIES': return { ...state, categories: action.categories };
    case 'SET_USERS': return { ...state, users: action.users };
    case 'SET_LANGUAGES': return { ...state, languages: action.languages };
    case 'SET_UPDATING': {
      const field = `updating${action.key}` as keyof ProductsState;
      const next = new Set(state[field] as Set<string>);
      if (action.isUpdating) next.add(action.id);
      else next.delete(action.id);
      return { ...state, [field]: next };
    }
    case 'SET_SEARCH': return { ...state, searchTerm: action.term };
    case 'SET_DEBOUNCED_SEARCH':
      return { ...state, debouncedSearch: action.term, selectedIds: new Set(), page: 1 };
    case 'SET_SELECTED_TCG':
      return { ...state, selectedTcg: action.tcg, selectedIds: new Set(), page: 1 };
    case 'SET_PAGE':
      return { ...state, page: action.page, selectedIds: new Set() };
    case 'SET_LIMIT': return { ...state, limit: action.limit };
    case 'SET_ADD_OPEN': return { ...state, isAddOpen: action.open };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab, selectedIds: new Set(), page: 1 };
    case 'SET_HIDE_OUT_OF_STOCK': return { ...state, hideOutOfStock: action.hide };
    case 'SET_OWNER_FILTER': return { ...state, ownerFilter: action.filter };
    case 'SET_OWNER_OPEN': return { ...state, ownerOpen: action.open };
    case 'TOGGLE_SELECT': {
      const next = new Set(state.selectedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, selectedIds: next };
    }
    case 'TOGGLE_SELECT_ALL': {
      if (state.selectedIds.size === state.products.length) return { ...state, selectedIds: new Set() };
      return { ...state, selectedIds: new Set(state.products.map(p => p.id)) };
    }
    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: new Set() };
    default: return state;
  }
}

export const initialProductsState: ProductsState = {
  products: [], apiProducts: [], isLoading: true, error: null, isDeleting: false,
  total: 0, totalPages: 0, sortField: 'createdAt', sortDirection: 'desc',
  tcgs: [], conditions: [], categories: [],
  updatingStock: new Set(), updatingCondition: new Set(), updatingOwner: new Set(), updatingLanguage: new Set(),
  users: [], languages: [], searchTerm: '', debouncedSearch: '', page: 1, limit: 20,
  isAddOpen: false, activeTab: 'all', hideOutOfStock: false, ownerFilter: '',
  ownerOpen: false,
  selectedTcg: 'all',
  selectedIds: new Set(),
};
