'use client';

import { useEffect, useCallback, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { usersAPI, adminCartAPI, searchAPI, singlesAPI } from '@/lib/api';
import { toast } from 'sonner';

export interface UserOption {
  id: string;
  name: string;
  email: string;
  username: string;
}

export interface SearchProduct {
  id?: string;
  importationId?: string;
  productId?: string;
  name?: string;
  cardName?: string;
  title?: string;
  img?: string;
  imageUrl?: string;
  foil?: boolean;
  isFoil?: boolean;
  language?: string;
  lang?: string;
  expansion?: string;
  cardNumber?: string;
  variant?: string;
  price?: number | string;
  owner?: { first_name?: string; last_name?: string; username?: string };
  isImportationImport?: boolean;
  isLocalInventory?: boolean;
  isImportation?: boolean;
}

export interface ApiUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  img: string;
  expansion: string;
  condition: string;
  language: string;
  isFoil: boolean;
  isImportationImport?: boolean;
  isImportation?: boolean;
  productData?: {
    expansion?: string;
    cardNumber?: string;
    variant?: string;
    language?: string;
    lang?: string;
    isFoil?: boolean;
    cardName?: string;
    name?: string;
    title?: string;
    price?: string | number;
    img?: string;
    imageUrl?: string;
    foil?: boolean;
    finalPrice?: string | number;
    owner?: {
      first_name?: string;
      last_name?: string;
      username?: string;
      email?: string;
    };
  };
}

interface CartsState {
  users: UserOption[];
  isLoadingUsers: boolean;
  userSearch: string;
  selectedUser: UserOption | null;
  cartItems: CartItem[];
  isLoadingCart: boolean;
  productSearch: string;
  autocompleteSuggestions: string[];
  searchResults: SearchProduct[];
  isSearching: boolean;
  selectedCardName: string | null;
  updatingItems: Set<string>;
  addingToCart: Set<string>;
  isCheckingOut: boolean;
}

type CartsAction =
  | { type: 'SET_USERS'; users: UserOption[] }
  | { type: 'SET_LOADING_USERS'; loading: boolean }
  | { type: 'SET_USER_SEARCH'; search: string }
  | { type: 'SET_SELECTED_USER'; user: UserOption | null }
  | { type: 'SET_CART_ITEMS'; items: CartItem[] }
  | { type: 'SET_LOADING_CART'; loading: boolean }
  | { type: 'SET_PRODUCT_SEARCH'; search: string }
  | { type: 'SET_AUTOCOMPLETE'; suggestions: string[] }
  | { type: 'SET_SEARCH_RESULTS'; results: SearchProduct[] }
  | { type: 'SET_IS_SEARCHING'; searching: boolean }
  | { type: 'SET_SELECTED_CARD'; name: string | null }
  | { type: 'SET_UPDATING_ITEM'; id: string; updating: boolean }
  | { type: 'SET_ADDING_TO_CART'; id: string; adding: boolean }
  | { type: 'SET_CHECKING_OUT'; checking: boolean }
  | { type: 'CLEAR_SEARCH' };

function cartsReducer(state: CartsState, action: CartsAction): CartsState {
  switch (action.type) {
    case 'SET_USERS': return { ...state, users: action.users };
    case 'SET_LOADING_USERS': return { ...state, isLoadingUsers: action.loading };
    case 'SET_USER_SEARCH': return { ...state, userSearch: action.search };
    case 'SET_SELECTED_USER':
      return {
        ...state,
        selectedUser: action.user,
        productSearch: '',
        searchResults: [],
        selectedCardName: null,
        autocompleteSuggestions: [],
      };
    case 'SET_CART_ITEMS': return { ...state, cartItems: action.items };
    case 'SET_LOADING_CART': return { ...state, isLoadingCart: action.loading };
    case 'SET_PRODUCT_SEARCH': return { ...state, productSearch: action.search };
    case 'SET_AUTOCOMPLETE': return { ...state, autocompleteSuggestions: action.suggestions };
    case 'SET_SEARCH_RESULTS': return { ...state, searchResults: action.results };
    case 'SET_IS_SEARCHING': return { ...state, isSearching: action.searching };
    case 'SET_SELECTED_CARD': return { ...state, selectedCardName: action.name };
    case 'SET_UPDATING_ITEM': {
      const next = new Set(state.updatingItems);
      if (action.updating) next.add(action.id); else next.delete(action.id);
      return { ...state, updatingItems: next };
    }
    case 'SET_ADDING_TO_CART': {
      const next = new Set(state.addingToCart);
      if (action.adding) next.add(action.id); else next.delete(action.id);
      return { ...state, addingToCart: next };
    }
    case 'SET_CHECKING_OUT': return { ...state, isCheckingOut: action.checking };
    case 'CLEAR_SEARCH':
      return {
        ...state,
        productSearch: '',
        searchResults: [],
        selectedCardName: null,
        autocompleteSuggestions: [],
      };
    default: return state;
  }
}

export function useCartsManager() {
  const { push } = useRouter();
  const [state, dispatch] = useReducer(cartsReducer, {
    users: [],
    isLoadingUsers: true,
    userSearch: '',
    selectedUser: null,
    cartItems: [],
    isLoadingCart: false,
    productSearch: '',
    autocompleteSuggestions: [],
    searchResults: [],
    isSearching: false,
    selectedCardName: null,
    updatingItems: new Set<string>(),
    addingToCart: new Set<string>(),
    isCheckingOut: false,
  });

  useEffect(() => {
    async function fetchUsers() {
      dispatch({ type: 'SET_LOADING_USERS', loading: true });
      try {
        const response = await usersAPI.list();
        let usersArray: ApiUser[] = [];
        if (Array.isArray(response)) usersArray = response;
        else if (response?.data && Array.isArray(response.data)) usersArray = response.data;
        else if (response?.success && response.data) usersArray = response.data;

        dispatch({
          type: 'SET_USERS',
          users: usersArray.map((u: ApiUser) => ({
            id: u.id,
            email: u.email,
            name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'N/A',
            username: u.username || '',
          })),
        });
      } catch {
        toast.error('Failed to load users');
      } finally {
        dispatch({ type: 'SET_LOADING_USERS', loading: false });
      }
    }
    void fetchUsers();
  }, []);

  const fetchCart = useCallback(async (userId?: string) => {
    const id = userId || state.selectedUser?.id;
    if (!id) return;
    dispatch({ type: 'SET_LOADING_CART', loading: true });
    try {
      const response = await adminCartAPI.getCart(id);
      const items = response?.data || response || [];
      dispatch({ type: 'SET_CART_ITEMS', items: Array.isArray(items) ? items : [] });
    } catch {
      toast.error('Failed to load cart');
    } finally {
      dispatch({ type: 'SET_LOADING_CART', loading: false });
    }
  }, [state.selectedUser]);

  const handleSelectUser = useCallback((user: UserOption | null) => {
    dispatch({ type: 'SET_SELECTED_USER', user });
    if (user) void fetchCart(user.id);
  }, [fetchCart]);

  const handleAutocomplete = async (query: string) => {
    if (query.length < 2) {
      dispatch({ type: 'SET_AUTOCOMPLETE', suggestions: [] });
      return;
    }
    try {
      const response = await searchAPI.autocomplete(query);
      const suggestions = response?.data || response || [];
      dispatch({ type: 'SET_AUTOCOMPLETE', suggestions: Array.isArray(suggestions) ? suggestions : [] });
    } catch { /* ignore */ }
  };

  const handleProductSearch = async (cardName: string) => {
    dispatch({ type: 'SET_SELECTED_CARD', name: cardName });
    dispatch({ type: 'SET_PRODUCT_SEARCH', search: cardName });
    dispatch({ type: 'SET_AUTOCOMPLETE', suggestions: [] });
    dispatch({ type: 'SET_IS_SEARCHING', searching: true });

    try {
      const [localResponse, importationResponse] = await Promise.allSettled([
        singlesAPI.list(1, 10, cardName),
        singlesAPI.importationSearch(cardName, 1),
      ]);

      let results: SearchProduct[] = [];

      if (localResponse.status === 'fulfilled') {
        const localData = localResponse.value;
        let localResults: SearchProduct[] = [];
        if (localData?.data?.data) localResults = localData.data.data;
        else if (localData?.data && Array.isArray(localData.data)) localResults = localData.data;
        else if (Array.isArray(localData)) localResults = localData;
        results = [...results, ...localResults];
      }

      if (importationResponse.status === 'fulfilled') {
        const importationData = importationResponse.value;
        let importationResults: SearchProduct[] = [];
        if (importationData?.data?.data) importationResults = importationData.data.data;
        else if (importationData?.data && Array.isArray(importationData.data))
          importationResults = importationData.data;
        else if (Array.isArray(importationData)) importationResults = importationData;
        importationResults = importationResults.map((item: SearchProduct) => ({
          ...item,
          isImportationImport: true,
          isLocalInventory: false,
        }));
        results = [...results, ...importationResults];
      }

      dispatch({ type: 'SET_SEARCH_RESULTS', results });
    } catch {
      toast.error('Search failed');
    } finally {
      dispatch({ type: 'SET_IS_SEARCHING', searching: false });
    }
  };

  const handleAddToCart = async (product: SearchProduct) => {
    if (!state.selectedUser) return;
    const productKey = product.id || product.importationId || `temp-${Date.now()}`;
    dispatch({ type: 'SET_ADDING_TO_CART', id: productKey, adding: true });
    try {
      const isImportation = !!product.importationId && !product.isLocalInventory;
      await adminCartAPI.addItem(state.selectedUser.id, {
        singleId: isImportation ? undefined : product.id,
        quantity: 1,
        isImportation,
        importationId: isImportation ? product.importationId : undefined,
        productData: isImportation
          ? {
              name: product.name || product.cardName || product.title,
              cardName: product.cardName || product.name,
              importationId: product.importationId,
              language: product.language || 'English',
              foil: product.foil || false,
              price: product.price,
              imageUrl: product.imageUrl || product.img,
            }
          : undefined,
      });
      toast.success('Item added to cart');
      dispatch({ type: 'CLEAR_SEARCH' });
      await fetchCart();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      dispatch({ type: 'SET_ADDING_TO_CART', id: productKey, adding: false });
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (!state.selectedUser || newQuantity < 1) return;
    dispatch({ type: 'SET_UPDATING_ITEM', id: itemId, updating: true });
    try {
      await adminCartAPI.updateItem(state.selectedUser.id, itemId, { quantity: newQuantity });
      dispatch({
        type: 'SET_CART_ITEMS',
        items: state.cartItems.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)),
      });
    } catch {
      toast.error('Failed to update quantity');
    } finally {
      dispatch({ type: 'SET_UPDATING_ITEM', id: itemId, updating: false });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!state.selectedUser) return;
    dispatch({ type: 'SET_UPDATING_ITEM', id: itemId, updating: true });
    try {
      await adminCartAPI.removeItem(state.selectedUser.id, itemId);
      dispatch({
        type: 'SET_CART_ITEMS',
        items: state.cartItems.filter((item) => item.id !== itemId),
      });
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    } finally {
      dispatch({ type: 'SET_UPDATING_ITEM', id: itemId, updating: false });
    }
  };

  const handleCheckoutForUser = async () => {
    if (!state.selectedUser || state.cartItems.length === 0) return;
    dispatch({ type: 'SET_CHECKING_OUT', checking: true });
    try {
      const response = await adminCartAPI.checkoutForUser(state.selectedUser.id, 'arrange', 'transfer');
      const data = response?.data || response;
      const orderId = data?.order?.id || data?.id;
      dispatch({ type: 'SET_CART_ITEMS', items: [] });
      toast.success('Orden creada exitosamente con pago por transferencia');
      if (orderId) push(`/dashboard/orders/${orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la orden');
    } finally {
      dispatch({ type: 'SET_CHECKING_OUT', checking: false });
    }
  };

  const handleClearCart = async () => {
    if (!state.selectedUser) return;
    if (!confirm("Clear all items from this user's cart?")) return;
    try {
      await adminCartAPI.clearCart(state.selectedUser.id);
      dispatch({ type: 'SET_CART_ITEMS', items: [] });
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
    }
  };

  return {
    state,
    dispatch,
    handleSelectUser,
    handleAutocomplete,
    handleProductSearch,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleCheckoutForUser,
    handleClearCart,
  };
}
