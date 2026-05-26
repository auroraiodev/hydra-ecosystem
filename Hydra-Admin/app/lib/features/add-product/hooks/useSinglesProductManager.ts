'use client';

import { useEffect, useCallback, useReducer } from 'react';
import { toast } from 'sonner';
import { useAutocomplete } from '@/hooks/useAutocomplete';
import { useSinglesMetadata } from './useSinglesMetadata';
import type {
  AddProductData,
  Category,
  User,
  ImportationCard,
  ImportationSearchFilters,
  ProductFormData,
  Tcg,
} from '../types';

export interface SinglesProductFormState {
  formData: Partial<ProductFormData>;
  searchQuery: string;
  showDropdown: boolean;
  selectedSuggestion: string;
  showImportationResults: boolean;
  selectedIndex: number;
  showCamera: boolean;
  newTagInput: string;
}

type SinglesProductFormAction =
  | { type: 'SET_FIELD'; field: keyof SinglesProductFormState; value: unknown }
  | { type: 'UPDATE_FORM'; field: keyof ProductFormData; value: unknown }
  | { type: 'UPDATE_FORM_BULK'; data: Partial<ProductFormData> }
  | { type: 'RESET_SEARCH' }
  | { type: 'SELECT_SUGGESTION'; suggestion: string };

function singlesProductFormReducer(
  state: SinglesProductFormState,
  action: SinglesProductFormAction
): SinglesProductFormState {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.field]: action.value };
    case 'UPDATE_FORM': return { ...state, formData: { ...state.formData, [action.field]: action.value as ProductFormData[keyof ProductFormData] } };
    case 'UPDATE_FORM_BULK': return { ...state, formData: { ...state.formData, ...action.data } };
    case 'RESET_SEARCH':
      return {
        ...state,
        searchQuery: '',
        selectedIndex: -1,
        showImportationResults: false,
        showDropdown: false,
        selectedSuggestion: '',
      };
    case 'SELECT_SUGGESTION':
      return {
        ...state,
        searchQuery: action.suggestion,
        selectedSuggestion: action.suggestion,
        showImportationResults: true,
        showDropdown: true,
        selectedIndex: -1,
        formData: { ...state.formData, cardName: action.suggestion },
      };
    default: return state;
  }
}

export function useSinglesProductManager({
  selectedCategory,
  selectedOwner,
  onAddItem,
  onSearchImportation,
  onSelectImportationCard,
  onCardAdded,
  importationFilters,
  importationResults,
  selectedTcg: _selectedTcg,
}: {
  selectedCategory: Category | null | undefined;
  selectedOwner: User | null | undefined;
  onAddItem: (item: AddProductData) => void;
  onSearchImportation?: (query: string, filters?: ImportationSearchFilters) => void;
  onSelectImportationCard?: (card: ImportationCard) => void;
  onCardAdded?: (importationId: string | null) => void;
  importationFilters?: ImportationSearchFilters;
  importationResults?: ImportationCard[];
  selectedTcg?: Tcg | null;
}) {
  const metadata = useSinglesMetadata();
  const { conditions, languages } = metadata;

  const [state, dispatch] = useReducer(singlesProductFormReducer, {
    formData: {
      cardName: '',
      cardNumber: '',
      category_id: selectedCategory?.id || '',
      condition_id: '',
      expansion: '',
      expansionCode: '',
      extendedArt: false,
      finalPrice: 0,
      foil: false,
      borderless: false,
      importationId: '',
      img: '',
      images: [],
      language_id: '',
      link: '',
      prerelease: false,
      stock: 1,
      surgeFoil: false,
      isSerialized: false,
      isAlternateFrame: false,
      isShowcase: false,
      priceMxnImportation: 0,
      priceMxnLocal: 0,
      tags: [],
      variant: '',
    },
    searchQuery: '',
    showDropdown: false,
    selectedSuggestion: '',
    showImportationResults: false,
    selectedIndex: -1,
    showCamera: false,
    newTagInput: '',
  });

  const setField = (field: keyof SinglesProductFormState, value: unknown) =>
    dispatch({ type: 'SET_FIELD', field, value });

  const setFormData = (update: Partial<ProductFormData> | ((prev: Partial<ProductFormData>) => Partial<ProductFormData>)) => {
    if (typeof update === 'function') {
      const next = update(state.formData);
      dispatch({ type: 'UPDATE_FORM_BULK', data: next });
    } else {
      dispatch({ type: 'UPDATE_FORM_BULK', data: update });
    }
  };

  useEffect(() => {
    if (conditions.length > 0 && !state.formData.condition_id) {
      const nm = conditions.find(c => c.name?.toLowerCase().includes('nm') || c.displayName?.toLowerCase().includes('near mint')) || conditions[0];
      dispatch({ type: 'UPDATE_FORM', field: 'condition_id', value: nm.id });
    }
    if (languages.length > 0 && !state.formData.language_id) {
      const en = languages.find(l => l.name?.toLowerCase().includes('english')) || languages[0];
      dispatch({ type: 'UPDATE_FORM', field: 'language_id', value: en.id });
    }
  }, [conditions, languages, state.formData.condition_id, state.formData.language_id]);

  const { suggestions, loading: isSearching } = useAutocomplete(state.searchQuery);

  const handleSearchChange = useCallback((value: string) => {
    dispatch({ type: 'SET_FIELD', field: 'searchQuery', value });
    dispatch({ type: 'SET_FIELD', field: 'selectedIndex', value: -1 });
    dispatch({ type: 'SET_FIELD', field: 'showImportationResults', value: false });
    dispatch({ type: 'SET_FIELD', field: 'showDropdown', value: value.length >= 2 });
    dispatch({ type: 'SET_FIELD', field: 'selectedSuggestion', value: '' });
  }, []);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    dispatch({ type: 'SELECT_SUGGESTION', suggestion });
    if (onSearchImportation && suggestion.trim()) {
      void onSearchImportation(suggestion.trim(), importationFilters);
    }
  }, [onSearchImportation, importationFilters]);

  const handleImportationCardSelect = useCallback((card: ImportationCard) => {
    const extractPrice = (priceString: unknown) => {
      if (!priceString) return 0;
      if (typeof priceString === 'number') return priceString;
      const match = String(priceString).match(/[\d,]+\.?\d*/);
      return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
    };

    const cardLanguage = card.language || 'English';
    const cleanCardLang = cardLanguage.toLowerCase().trim();
    const matchedLanguage = languages.find(l => {
      const name = l.name?.toLowerCase() || '';
      const disp = l.displayName?.toLowerCase() || '';
      
      const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normCardLang = normalize(cleanCardLang);
      const normName = normalize(name);
      const normDisp = normalize(disp);
      
      return (
        name === cleanCardLang ||
        disp === cleanCardLang ||
        normName === normCardLang ||
        normDisp === normCardLang ||
        (normCardLang === 'english' && (normName.includes('ingl') || normName.includes('english'))) ||
        (normCardLang === 'japanese' && (normName.includes('japon') || normName.includes('japanese'))) ||
        (normCardLang === 'ingles' && (normName.includes('ingl') || normName.includes('english'))) ||
        (normCardLang === 'japones' && (normName.includes('japon') || normName.includes('japanese')))
      );
    }) || languages.find(l => {
      const name = (l.name || '').toLowerCase();
      return name.includes('ingl') || name.includes('english');
    }) || null;

    const cardCondition = card.condition || 'Near Mint';
    const matchedCondition = conditions.find(c => 
      c.name?.toLowerCase() === cardCondition.toLowerCase() || 
      c.displayName?.toLowerCase() === cardCondition.toLowerCase()
    ) || conditions.find(c => c.name?.toLowerCase().includes('nm')) || null;

    const populatedData: Partial<ProductFormData> = {
      cardName: card.cardName || card.name || card.title || '',
      finalPrice: card.finalPrice || extractPrice(card.price) || 0,
      img: card.img || card.imageUrl || '',
      images: card.images || [],
      expansion: card.expansion || card.set || card.setName || '',
      expansionCode: card.expansionCode || card.setCode || '',
      cardNumber: card.cardNumber || '',
      importationId: card.importationId || card.productId || card.id || '',
      link: card.link || '',
      foil: Boolean(card.bulkIsFoil !== undefined ? card.bulkIsFoil : card.foil || card.isFoil || false),
      borderless: Boolean(card.borderless || card.isBorderless || false),
      stock: 1,
      category_id: selectedCategory?.id || '',
      condition_id: matchedCondition?.id || '',
      language_id: matchedLanguage?.id || '',
      variant: card.variant || '',
      priceMxnImportation: card.price_mxn_importation || 0,
      priceMxnLocal: card.price_mxn_local || 0,
    };

    dispatch({ type: 'UPDATE_FORM_BULK', data: populatedData });
    if (onSelectImportationCard) onSelectImportationCard(card);
    dispatch({ type: 'RESET_SEARCH' });
    dispatch({ type: 'SET_FIELD', field: 'searchQuery', value: populatedData.cardName || '' });
  }, [languages, conditions, selectedCategory, onSelectImportationCard]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (state.showImportationResults && importationResults && importationResults.length > 0) handleImportationCardSelect(importationResults[0]);
      else if (state.showDropdown && suggestions.length > 0 && state.selectedIndex >= 0) handleSuggestionSelect(suggestions[state.selectedIndex]);
      else if (state.searchQuery.trim()) handleSuggestionSelect(state.searchQuery.trim());
      return;
    }
    if (!state.showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      dispatch({ type: 'SET_FIELD', field: 'selectedIndex', value: state.selectedIndex < suggestions.length - 1 ? state.selectedIndex + 1 : state.selectedIndex });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      dispatch({ type: 'SET_FIELD', field: 'selectedIndex', value: state.selectedIndex > 0 ? state.selectedIndex - 1 : -1 });
    } else if (e.key === 'Escape') {
      dispatch({ type: 'SET_FIELD', field: 'showDropdown', value: false });
    }
  }, [state.searchQuery, state.showImportationResults, importationResults, state.showDropdown, suggestions, state.selectedIndex, handleSuggestionSelect, handleImportationCardSelect]);

  const isFormValid = useCallback(() => {
    return !!(state.formData.cardName && state.formData.condition_id && state.formData.language_id && state.formData.finalPrice && state.formData.finalPrice > 0);
  }, [state.formData]);

  const handleAddItem = () => {
    if (!selectedCategory || !selectedOwner || !isFormValid()) {
      if (!selectedCategory) toast.error('Selecciona una categoría');
      if (!selectedOwner) toast.error('Selecciona un propietario');
      if (!isFormValid()) toast.error('Completa los campos obligatorios');
      return;
    }

    const itemToAdd: AddProductData = {
      name: state.formData.cardName || '',
      title: state.formData.cardName || '',
      price: state.formData.finalPrice || 0,
      imageUrl: state.formData.img || '',
      imageUrls: [],
      inStock: state.formData.stock || 1,
      stockStatus: 'available',
      tags: state.formData.tags || [],
      owner: {
        type: 'user',
        id: selectedOwner.id,
        email: selectedOwner.email,
        name: selectedOwner.name,
      },
      categoryId: selectedCategory.id,
      category: selectedCategory.name,
      conditionId: state.formData.condition_id,
      languageId: state.formData.language_id,
      expansion: state.formData.expansion,
      importationId: state.formData.importationId,
      isFoil: state.formData.foil || false,
      isBorderless: state.formData.borderless || false,
      priceMxnImportation: state.formData.priceMxnImportation || undefined,
      priceMxnLocal: state.formData.priceMxnLocal || undefined,
      consignmentItem: false,
      commissionRate: selectedOwner.productCommissionRate || 0,
    };

    try {
      onAddItem(itemToAdd);
      toast.success('Carta agregada');
      dispatch({ type: 'UPDATE_FORM_BULK', data: { cardName: '', finalPrice: 0, importationId: '', img: '', stock: 1, tags: [] } });
      dispatch({ type: 'RESET_SEARCH' });
      if (onCardAdded) onCardAdded(itemToAdd.importationId || null);
    } catch {
      toast.error('Error al agregar carta');
    }
  };

  return {
    state,
    dispatch,
    metadata,
    suggestions,
    isSearching,
    setField,
    setFormData,
    handleSearchChange,
    handleSuggestionSelect,
    handleImportationCardSelect,
    handleKeyDown,
    handleAddItem,
    isFormValid,
  };
}
