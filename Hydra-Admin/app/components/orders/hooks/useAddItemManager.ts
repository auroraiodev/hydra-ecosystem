'use client';

import { useReducer, useState, useEffect } from 'react';
import { singlesAPI, searchAPI } from '@/lib/api';
import { toast } from 'sonner';

interface SearchResultItem {
  id?: string;
  importationId?: string;
  name?: string;
  cardName?: string;
  title?: string;
  img?: string;
  imageUrl?: string;
  price?: string | number;
  finalPrice?: number;
  foil?: boolean;
  isFoil?: boolean;
  language?: string;
  lang?: string;
  expansion?: string;
  set_name?: string;
  cardNumber?: string | number;
  variant?: string;
  stock?: number;
  isImportationImport?: boolean;
  isLocalInventory?: boolean;
  productId?: string | number;
}

interface AddItemPayload {
  singleId: string;
  quantity: number;
  isImportation?: boolean;
  cardName?: string;
  productData?: {
    name?: string;
    cardName?: string;
    importationId?: string;
    price?: number;
    imageUrl?: string;
    language?: string;
  foil?: boolean;
  };
}

interface SearchState {
  query: string;
  suggestions: string[];
  results: SearchResultItem[];
  isLoading: boolean;
}

type SearchAction =
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_SUGGESTIONS'; suggestions: string[] }
  | { type: 'SET_RESULTS'; results: SearchResultItem[] }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'CLEAR' };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY': return { ...state, query: action.query };
    case 'SET_SUGGESTIONS': return { ...state, suggestions: action.suggestions };
    case 'SET_RESULTS': return { ...state, results: action.results };
    case 'SET_LOADING': return { ...state, isLoading: action.isLoading };
    case 'CLEAR': return { query: '', suggestions: [], results: [], isLoading: false };
    default: return state;
  }
}

export function useAddItemManager({
  onConfirm,
  onClose,
}: {
  onConfirm: (itemData: AddItemPayload) => Promise<void>;
  onClose: () => void;
}) {
  const [searchState, dispatchSearch] = useReducer(searchReducer, {
    query: '',
    suggestions: [],
    results: [],
    isLoading: false,
  });

  const [selectedProduct, setSelectedProduct] = useState<SearchResultItem | null>(null);
  const [selectedCardName, setSelectedCardName] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const getAutocomplete = async (query: string) => {
      if (query.length < 2) {
        dispatchSearch({ type: 'SET_SUGGESTIONS', suggestions: [] });
        return;
      }
      try {
        const response = await searchAPI.autocomplete(query);
        const suggestions = response?.data || response || [];
        dispatchSearch({ type: 'SET_SUGGESTIONS', suggestions: Array.isArray(suggestions) ? suggestions : [] });
      } catch (error) {
        console.error('Autocomplete failed', error);
      }
    };
    const timer = setTimeout(() => { getAutocomplete(searchState.query); }, 300);
    return () => clearTimeout(timer);
  }, [searchState.query]);

  const handleSelectCard = async (cardName: string) => {
    setSelectedCardName(cardName);
    dispatchSearch({ type: 'SET_QUERY', query: cardName });
    dispatchSearch({ type: 'SET_SUGGESTIONS', suggestions: [] });
    dispatchSearch({ type: 'SET_LOADING', isLoading: true });

    try {
      const [localResponse, importationResponse] = await Promise.allSettled([
        singlesAPI.list(1, 10, cardName),
        singlesAPI.importationSearch(cardName, 1),
      ]);

      let combinedResults: SearchResultItem[] = [];
      if (localResponse.status === 'fulfilled') {
        const localData = localResponse.value;
        let localItems: SearchResultItem[] = [];
        if (localData?.data?.data) localItems = localData.data.data;
        else if (localData?.data && Array.isArray(localData.data)) localItems = localData.data;
        else if (Array.isArray(localData)) localItems = localData;
        localItems = localItems.map((item) => ({ ...item, isLocalInventory: true, isImportationImport: false }));
        combinedResults = [...combinedResults, ...localItems];
      }

      if (importationResponse.status === 'fulfilled') {
        const importationData = importationResponse.value;
        let importationItems: SearchResultItem[] = [];
        if (importationData?.data?.data) importationItems = importationData.data.data;
        else if (importationData?.data && Array.isArray(importationData.data)) importationItems = importationData.data;
        else if (Array.isArray(importationData)) importationItems = importationData;
        importationItems = importationItems.map((item) => ({ ...item, isLocalInventory: false, isImportationImport: true }));
        combinedResults = [...combinedResults, ...importationItems];
      }
      dispatchSearch({ type: 'SET_RESULTS', results: combinedResults });
    } catch (error) {
      console.error('Search failed', error);
      toast.error('Failed to search products');
    } finally {
      dispatchSearch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  const handleSelect = (product: SearchResultItem) => {
    setSelectedProduct(product);
    setQuantity(1);
    dispatchSearch({ type: 'SET_QUERY', query: '' });
    dispatchSearch({ type: 'SET_RESULTS', results: [] });
  };

  const handleSubmit = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      const isImportation = selectedProduct.isImportationImport;
      const payload = {
        singleId: isImportation ? String(selectedProduct.importationId || selectedProduct.productId) : (selectedProduct.id || ''),
        quantity,
        isImportation,
        cardName: isImportation ? selectedProduct.cardName || selectedProduct.name : undefined,
        productData: isImportation ? {
          name: selectedProduct.cardName || selectedProduct.name || selectedProduct.title,
          cardName: selectedProduct.cardName || selectedProduct.name,
          importationId: String(selectedProduct.importationId || selectedProduct.productId),
          price: typeof selectedProduct.price === 'string' ? parseFloat(selectedProduct.price.replace(/[^0-9.-]+/g, '')) : selectedProduct.price,
          imageUrl: selectedProduct.img || selectedProduct.imageUrl,
          language: selectedProduct.language,
          foil: selectedProduct.foil,
        } : undefined,
      };
      await onConfirm(payload);
      setSelectedProduct(null);
      setQuantity(1);
      dispatchSearch({ type: 'SET_QUERY', query: '' });
      onClose();
    } catch { /* ignore */ }
    finally { setIsSubmitting(false); }
  };

  return {
    searchState,
    dispatchSearch,
    selectedProduct,
    setSelectedProduct,
    selectedCardName,
    setSelectedCardName,
    quantity,
    setQuantity,
    isSubmitting,
    handleSelectCard,
    handleSelect,
    handleSubmit,
  };
}
