'use client';

import React, { useState, useReducer, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Add24Regular } from '@fluentui/react-icons';
import { SinglesSearch } from './components/SinglesSearch';
import { SinglesBasicInfo } from './components/SinglesBasicInfo';
import { SinglesImages } from './components/SinglesImages';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAutocomplete } from '@/hooks/useAutocomplete';

import { conditionsAPI, languagesAPI, tagsAPI } from '@/lib/api';
import type { AddProductData, Category, Condition, Language, User, ImportationCard } from './types';
import { CameraScanner } from './CameraScanner';
import { ProductFormPreview } from './components/ProductFormPreview';

// Form state matching API structure exactly
export interface ProductFormData {
  cardName: string;
  cardNumber: string;
  category_id: string;
  condition_id: string;
  expansion: string;
  extendedArt: boolean;
  finalPrice: number;
  foil: boolean;
  borderless: boolean;
  importationId: string;
  img: string;
  images: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  language_id: string;
  link: string;
  prerelease: boolean;
  premierPlay: boolean;
  stock: number;
  surgeFoil: boolean;
  tags: string[];
  variant: string;
}

interface SinglesProductFormProps {
  selectedCategory: Category;
  selectedOwner: User;
  conditions?: Condition[]; // Made optional since we'll load it internally
  languages?: Language[]; // Made optional since we'll load it internally
  validationErrors: Record<string, string>;
  onAddItem: (item: AddProductData) => void;
  onSelectCategory: (category: Category | null) => void;
  onSearchImportation?: (
    query: string,
    filters?: import('./types').ImportationSearchFilters
  ) => void;
  importationResults?: ImportationCard[];
  isSearchingImportation?: boolean;
  onSelectImportationCard?: (card: ImportationCard) => void;
  onCardAdded?: (importationId: string | null) => void;
  isSubmitting?: boolean;
  importationFilters?: import('./types').ImportationSearchFilters;
  onImportationFiltersChange?: (filters: import('./types').ImportationSearchFilters) => void;
  selectedTcg?: import('./types').Tcg | null;
}

const EMPTY_CONDITIONS: Condition[] = [];
const EMPTY_LANGUAGES: Language[] = [];
const EMPTY_IMPORTATION_RESULTS: ImportationCard[] = [];
const EMPTY_IMPORTATION_FILTERS: import('./types').ImportationSearchFilters = {};

export function SinglesProductForm({
  selectedCategory,
  selectedOwner,
  conditions: conditionsProp = EMPTY_CONDITIONS,
  languages: languagesProp = EMPTY_LANGUAGES,
  validationErrors,
  onAddItem,
  onSelectCategory,
  onSearchImportation,
  importationResults = EMPTY_IMPORTATION_RESULTS,
  isSearchingImportation = false,
  onSelectImportationCard,
  onCardAdded,
  isSubmitting = false,
  importationFilters = EMPTY_IMPORTATION_FILTERS,
  onImportationFiltersChange,
  selectedTcg,
}: SinglesProductFormProps) {
  type ConditionsLoadState = { conditions: Condition[]; isLoadingConditions: boolean };
  const [conditionsLoadState, dispatchConditionsLoadState] = useReducer(
    (s: ConditionsLoadState, a: Partial<ConditionsLoadState>): ConditionsLoadState => ({
      ...s,
      ...a,
    }),
    { conditions: conditionsProp, isLoadingConditions: false }
  );
  const { conditions, isLoadingConditions } = conditionsLoadState;

  type LanguagesLoadState = { languages: Language[]; isLoadingLanguages: boolean };
  const [languagesLoadState, dispatchLanguagesLoadState] = useReducer(
    (s: LanguagesLoadState, a: Partial<LanguagesLoadState>): LanguagesLoadState => ({ ...s, ...a }),
    { languages: languagesProp, isLoadingLanguages: false }
  );
  const { languages, isLoadingLanguages } = languagesLoadState;

  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    cardName: '',
    cardNumber: '',
    category_id: selectedCategory?.id || '',
    condition_id: '', // Will be set to near mint when conditions load
    expansion: '',
    extendedArt: false,
    finalPrice: 0,
    foil: false,
    borderless: false,
    importationId: '',
    img: '',
    images: [], // Initialize images array
    language_id: '',
    link: '',
    prerelease: false,
    premierPlay: false,
    stock: 1,
    surgeFoil: false,
    tags: [], // Will be populated from API
    variant: '',
  });

  type SearchUiState = {
    searchQuery: string;
    showDropdown: boolean;
    selectedSuggestion: string;
    showImportationResults: boolean;
    selectedIndex: number;
    showCamera: boolean;
  };
  const [searchUiState, dispatchSearchUi] = useReducer(
    (s: SearchUiState, a: Partial<SearchUiState>): SearchUiState => ({ ...s, ...a }),
    {
      searchQuery: '',
      showDropdown: false,
      selectedSuggestion: '',
      showImportationResults: false,
      selectedIndex: -1,
      showCamera: false,
    }
  );
  const { searchQuery, showDropdown, selectedSuggestion, showImportationResults, selectedIndex, showCamera } =
    searchUiState;
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Tags state
  const [newTagInput, setNewTagInput] = useState('');
  const [, setAvailableTags] = useState<Array<{ id: string; name: string; display_name?: string }>>(
    []
  );
  type TagsLoadState = { defaultTags: string[]; isLoadingTags: boolean };
  const [tagsLoadState, dispatchTagsLoadState] = useReducer(
    (s: TagsLoadState, a: Partial<TagsLoadState>): TagsLoadState => ({ ...s, ...a }),
    { defaultTags: [], isLoadingTags: false }
  );
  const { defaultTags } = tagsLoadState;

  const { suggestions, loading: isSearching } = useAutocomplete(searchQuery);
  const searchMode = isSearchingImportation
    ? 'searching-importation'
    : isSearching
      ? 'searching'
      : 'idle';

  const handleSearchChange = useCallback((value: string) => {
    dispatchSearchUi({ searchQuery: value, selectedIndex: -1, showImportationResults: false, selectedSuggestion: '' });
  }, []);

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      dispatchSearchUi({ searchQuery: suggestion, selectedSuggestion: suggestion, showImportationResults: true, showDropdown: true, selectedIndex: -1 });
      setFormData((prev) => ({ ...prev, name: suggestion }));

      if (onSearchImportation && suggestion.trim()) {
        onSearchImportation(suggestion.trim(), importationFilters);
      }
    },
    [onSearchImportation, importationFilters]
  );

  // Track last processed card to prevent duplicate processing
  const lastProcessedCardRef = useRef<string | null>(null);
  const lastProcessedTimeRef = useRef<number>(0);

  // Track if we're currently adding an item to prevent duplicate submissions
  const isAddingItemRef = useRef<boolean>(false);

  const handleImportationCardSelect = useCallback(
    (card: ImportationCard) => {
      // Log immediately when card is received
      console.log('🎯 [FOIL DEBUG] ========== handleImportationCardSelect CALLED ==========');
      console.log('🎯 [FOIL DEBUG] Full card object received:', card);
      console.log('🎯 [FOIL DEBUG] Card summary:', {
        name: card?.name || card?.title || card?.cardName,
        hasBulkIsFoil: 'bulkIsFoil' in card,
        bulkIsFoil: card?.bulkIsFoil,
        bulkIsFoilType: typeof card?.bulkIsFoil,
        foil: card?.foil,
        isFoil: card?.isFoil,
        cardKeys: card ? Object.keys(card) : [],
      });

      // Prevent duplicate processing of the same card
      const cardId = card?.importationId || card?.productId || card?.id || '';
      const now = Date.now();

      // If same card processed within 500ms, ignore
      if (lastProcessedCardRef.current === cardId && now - lastProcessedTimeRef.current < 500) {
        console.log('⏭️ Ignoring duplicate card processing:', cardId);
        return;
      }

      lastProcessedCardRef.current = cardId;
      lastProcessedTimeRef.current = now;
      const extractPrice = (priceString: string | number | undefined) => {
        if (!priceString) return 0;
        if (typeof priceString === 'number') return priceString;
        const match = String(priceString).match(/[\d,]+\.?\d*/);
        return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
      };

      let expansionValue = '';
      if (card.set != null && String(card.set).trim() !== '') {
        expansionValue = String(card.set).trim();
      } else if (card.expansion != null && String(card.expansion).trim() !== '') {
        expansionValue = String(card.expansion).trim();
      } else if (card.setName != null && String(card.setName).trim() !== '') {
        expansionValue = String(card.setName).trim();
      }

      if (expansionValue.toUpperCase() === 'SINGLES' || expansionValue.toUpperCase() === 'CARDS') {
        expansionValue = '';
      }

      let cardNumberValue = card.cardNumber || '';
      if (!cardNumberValue || cardNumberValue.trim() === '') {
        const title = card.title || card.name || '';
        const numberMatch = title.match(/\([A-Z0-9-]+\s*-\s*(\d+)\)/);
        if (numberMatch && numberMatch[1]) {
          cardNumberValue = numberMatch[1];
        }
      }

      const finalPriceValue =
        card.finalPrice || extractPrice(card.price) || extractPrice(card.formattedPrice) || 0;

      const cardLanguage = card.language || 'Inglés';
      const matchedLanguage =
        languages.find(
          (lang) =>
            lang.name?.toLowerCase() === cardLanguage?.toLowerCase() ||
            lang.displayName?.toLowerCase() === cardLanguage?.toLowerCase() ||
            lang.name?.toLowerCase().includes(cardLanguage?.toLowerCase()) ||
            lang.displayName?.toLowerCase().includes(cardLanguage?.toLowerCase()) ||
            ((cardLanguage?.toLowerCase() === 'inglés' ||
              cardLanguage?.toLowerCase() === 'english') &&
              (lang.name?.toLowerCase().includes('inglés') ||
                lang.name?.toLowerCase().includes('english') ||
                lang.displayName?.toLowerCase().includes('inglés') ||
                lang.displayName?.toLowerCase().includes('english')))
        ) ||
        languages.find(
          (lang) =>
            lang.name?.toLowerCase().includes('inglés') ||
            lang.name?.toLowerCase().includes('english')
        ) ||
        null;

      const cardCondition = card.condition || 'Near Mint';
      const matchedCondition =
        conditions.find(
          (c) =>
            c.name?.toLowerCase() === cardCondition?.toLowerCase() ||
            c.displayName?.toLowerCase() === cardCondition?.toLowerCase() ||
            c.name?.toLowerCase().includes(cardCondition?.toLowerCase()) ||
            c.displayName?.toLowerCase().includes(cardCondition?.toLowerCase()) ||
            (cardCondition?.toLowerCase().includes('near') &&
              cardCondition?.toLowerCase().includes('mint') &&
              (c.name?.toLowerCase().includes('near') ||
                c.displayName?.toLowerCase().includes('near')))
        ) ||
        conditions.find(
          (c) =>
            c.name?.toLowerCase().includes('near-mint') ||
            c.displayName?.toLowerCase().includes('near mint')
        ) ||
        null;

      // Stock should always be 1 by default when selecting a card
      // User must manually change it if they want a different value
      const stockValue = 1;

      // Foil detection - EXACTLY the same pattern as borderless
      // bulkIsFoil takes priority (from bulk import), then card.foil, then card.isFoil
      const foilValue = Boolean(
        card.bulkIsFoil !== undefined ? card.bulkIsFoil : card.foil || card.isFoil || false
      );

      console.log('🔍 [FOIL] Detected value:', foilValue, {
        bulkIsFoil: card.bulkIsFoil,
        foil: card.foil,
        isFoil: card.isFoil,
        cardName: card.cardName || card.name || card.title,
      });

      const populatedData: Partial<ProductFormData> = {
        cardName: card.cardName || card.name || card.title || '',
        finalPrice: finalPriceValue,
        img: card.img || card.imageUrl || '',
        images: card.images || [], // Populate images if available
        expansion: expansionValue,
        cardNumber: cardNumberValue,
        importationId: card.importationId || card.productId || card.id || '',
        link: card.link || '',
        foil: foilValue, // Same pattern as borderless - already Boolean()
        borderless: Boolean(card.borderless || card.isBorderless || false),
        surgeFoil: Boolean(card.surgeFoil || false),
        extendedArt: Boolean(card.extendedArt || false),
        prerelease: Boolean(card.prerelease || false),
        premierPlay: Boolean(card.premierPlay || false),
        stock: stockValue,
        tags: card.tags || [],
        category_id: selectedCategory?.id || '',
        condition_id: matchedCondition?.id || '',
        language_id: matchedLanguage?.id || '',
        variant: card.variant || '',
      };

      console.log('💾 Populated form data:', {
        cardName: populatedData.cardName,
        finalPrice: populatedData.finalPrice,
        stock: populatedData.stock,
        expansion: populatedData.expansion,
        foil: populatedData.foil,
        borderless: populatedData.borderless,
        surgeFoil: populatedData.surgeFoil,
        extendedArt: populatedData.extendedArt,
        prerelease: populatedData.prerelease,
        premierPlay: populatedData.premierPlay,
      });

      // Force update with explicit boolean values to ensure checkboxes update
      // Same pattern as borderless - no special handling needed
      setFormData((prev) => {
        const updated = {
          ...prev,
          ...populatedData,
        };

        // Ensure foil is set correctly (same as borderless - already Boolean)
        updated.foil = foilValue;

        // Ensure all boolean fields are set correctly
        updated.borderless = Boolean(populatedData.borderless ?? false);
        updated.surgeFoil = Boolean(populatedData.surgeFoil ?? false);
        updated.extendedArt = Boolean(populatedData.extendedArt ?? false);
        updated.prerelease = Boolean(populatedData.prerelease ?? false);
        updated.premierPlay = Boolean(populatedData.premierPlay ?? false);

        console.log('🔄 [FOIL DEBUG] ========== FORM DATA UPDATE ==========');
        console.log('🔄 [FOIL DEBUG] Updated formData special fields:', {
          foil: updated.foil,
          foilValue: foilValue,
          bulkIsFoil: card.bulkIsFoil,
          prevFoil: prev.foil,
          populatedDataFoil: populatedData.foil,
          borderless: updated.borderless,
          borderlessFromCard: card.borderless || card.isBorderless,
          surgeFoil: updated.surgeFoil,
          extendedArt: updated.extendedArt,
          prerelease: updated.prerelease,
          premierPlay: updated.premierPlay,
        });
        console.log('🔄 [FOIL DEBUG] Full updated formData object:', updated);
        console.log(
          '🔄 [FOIL DEBUG] Final foil value in formData:',
          updated.foil,
          '| Type:',
          typeof updated.foil,
          '| Should render as checked:',
          updated.foil === true
        );
        console.log('🔄 [FOIL DEBUG] ========== FORM DATA UPDATE END ==========');

        return updated;
      });

      if (onSelectImportationCard) {
        onSelectImportationCard(card);
      }

      dispatchSearchUi({ searchQuery: populatedData.cardName || '', showDropdown: false, showImportationResults: false, selectedSuggestion: '' });
    },
    [onSelectImportationCard, languages, conditions, selectedCategory]
  );

  // Handle card selection from external sources (like bulk import)
  // Use a ref to store the latest card selection callback
  const cardSelectionRef = useRef<((card: ImportationCard) => void) | null>(null);

  useEffect(() => {
    cardSelectionRef.current = handleImportationCardSelect;
  }, [handleImportationCardSelect]);

  // Expose the handler so it can be called from outside (like bulk import)
  useEffect(() => {
    // Always expose the handler, even if onSelectImportationCard is not provided
    (
      window as Window & { __handleBulkImportCardSelect?: (card: ImportationCard) => void }
    ).__handleBulkImportCardSelect = (card: ImportationCard) => {
      console.log('🔄 [FORM HANDLER] __handleBulkImportCardSelect called with card:', {
        name: card?.name || card?.title || card?.cardName,
        bulkIsFoil: card?.bulkIsFoil,
        bulkIsFoilType: typeof card?.bulkIsFoil,
        hasBulkIsFoil: 'bulkIsFoil' in (card || {}),
        cardKeys: card ? Object.keys(card) : [],
      });
      if (card && cardSelectionRef.current) {
        console.log('🔄 [FORM HANDLER] Calling cardSelectionRef.current with card');
        cardSelectionRef.current(card);
      }
      // Also call the original callback if provided
      if (onSelectImportationCard) {
        onSelectImportationCard(card);
      }
    };

    return () => {
      if (
        (window as Window & { __handleBulkImportCardSelect?: (card: ImportationCard) => void })
          .__handleBulkImportCardSelect
      ) {
        delete (
          window as Window & { __handleBulkImportCardSelect?: (card: ImportationCard) => void }
        ).__handleBulkImportCardSelect;
      }
    };
  }, [onSelectImportationCard]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (showImportationResults && importationResults && importationResults.length > 0) {
          handleImportationCardSelect(importationResults[0]);
        } else if (showDropdown && suggestions.length > 0 && selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else if (searchQuery.trim()) {
          handleSuggestionSelect(searchQuery.trim());
        }
        return;
      }

      if (!showDropdown || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          dispatchSearchUi({ selectedIndex: Math.min(selectedIndex + 1, suggestions.length - 1) });
          break;
        case 'ArrowUp':
          e.preventDefault();
          dispatchSearchUi({ selectedIndex: Math.max(selectedIndex - 1, -1) });
          break;
        case 'Escape':
          dispatchSearchUi({ showDropdown: false, selectedIndex: -1 });
          break;
      }
    },
    [
      searchQuery,
      showImportationResults,
      importationResults,
      showDropdown,
      suggestions,
      selectedIndex,
      handleSuggestionSelect,
      handleImportationCardSelect,
    ]
  );

  useEffect(() => {
    if (suggestions.length > 0 && !showImportationResults) {
      dispatchSearchUi({ showDropdown: true });
    } else if (suggestions.length === 0 && !showImportationResults) {
      dispatchSearchUi({ showDropdown: false });
    }
  }, [suggestions, showImportationResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        dispatchSearchUi({ showDropdown: false, selectedIndex: -1 });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load conditions from API on mount
  useEffect(() => {
    const loadConditions = async () => {
      if (conditions.length > 0) {
        // Already loaded from props, skip
        return;
      }

      dispatchConditionsLoadState({ isLoadingConditions: true });
      let mappedConditions: Condition[] = [];
      try {
        const response = await conditionsAPI.list();

        let conds: Array<{
          id?: string;
          _id?: string;
          name?: string;
          displayName?: string;
          display_name?: string;
          isActive?: boolean | string;
          is_active?: boolean | string;
        }> = [];

        // Handle different response structures
        if (Array.isArray(response)) {
          conds = response;
        } else if (response?.data) {
          if (response.data.data && Array.isArray(response.data.data)) {
            conds = response.data.data;
          } else if (Array.isArray(response.data)) {
            conds = response.data;
          } else {
            conds = [response.data];
          }
        } else if (response?.success && response.data) {
          if (response.data.data && Array.isArray(response.data.data)) {
            conds = response.data.data;
          } else if (Array.isArray(response.data)) {
            conds = response.data;
          } else {
            conds = [response.data];
          }
        }

        // Filter for active conditions
        const activeConds = conds.filter((c) => {
          return (
            c.isActive !== false &&
            c.isActive !== 'false' &&
            c.is_active !== false &&
            c.is_active !== 'false'
          );
        });

        // Map to Condition format
        mappedConditions = activeConds.map((c) => ({
          id: c.id || c._id || '',
          name: c.name || '',
          displayName: c.displayName || c.display_name || c.name || '',
        }));

        // Set default condition to "near mint" if none is selected
        if (mappedConditions.length > 0 && !formData.condition_id) {
          const defaultCondition =
            mappedConditions.find((c) => {
              const name = c.name?.toLowerCase() || '';
              const displayName = c.displayName?.toLowerCase() || '';
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const code = ((c as any).code as string) || '';
              return (
                name.includes('near-mint') ||
                name.includes('nearmint') ||
                name.includes('nm') ||
                displayName.includes('near mint') ||
                displayName.includes('near-mint') ||
                code === 'nm'
              );
            }) || mappedConditions[0]; // Fallback to first condition if near mint not found

          if (defaultCondition) {
            setFormData((prev) => ({
              ...prev,
              condition_id: defaultCondition.id,
            }));
          }
        }
      } catch (error) {
        console.error('Error loading conditions:', error);
        toast.error('Error al cargar las condiciones');
      } finally {
        dispatchConditionsLoadState({ conditions: mappedConditions, isLoadingConditions: false });
      }
    };

    void loadConditions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Load languages from API on mount
  useEffect(() => {
    const loadLanguages = async () => {
      if (languages.length > 0) {
        // Already loaded from props, skip
        return;
      }

      dispatchLanguagesLoadState({ isLoadingLanguages: true });
      let mappedLanguages: Language[] = [];
      try {
        const response = await languagesAPI.list();

        let langs: Array<{
          id: string;
          name: string;
          displayName?: string;
          display_name?: string;
          isActive?: boolean | string;
          is_active?: boolean | string;
        }> = [];

        // Handle different response structures
        if (Array.isArray(response)) {
          langs = response;
        } else if (response?.data) {
          if (response.data.data && Array.isArray(response.data.data)) {
            langs = response.data.data;
          } else if (Array.isArray(response.data)) {
            langs = response.data;
          } else {
            langs = [response.data];
          }
        } else if (response?.success && response.data) {
          if (response.data.data && Array.isArray(response.data.data)) {
            langs = response.data.data;
          } else if (Array.isArray(response.data)) {
            langs = response.data;
          } else {
            langs = [response.data];
          }
        }

        // Filter for active languages
        const activeLangs = langs.filter((l) => l.isActive !== false && l.is_active !== false);

        // Map to Language format
        mappedLanguages = activeLangs.map((l) => ({
          id: l.id,
          name: l.name,
          displayName: l.displayName || l.display_name || l.name,
        }));

        // Set default language if none is selected
        if (mappedLanguages.length > 0 && !formData.language_id) {
          const defaultLanguage = mappedLanguages.find(
            (l) =>
              l.name?.toLowerCase().includes('english') ||
              l.name?.toLowerCase().includes('inglés') ||
              l.displayName?.toLowerCase().includes('english') ||
              l.displayName?.toLowerCase().includes('inglés')
          );
          if (defaultLanguage) {
            setFormData((prev) => ({
              ...prev,
              language_id: defaultLanguage.id,
            }));
          }
        }
      } catch (error) {
        console.error('Error loading languages:', error);
        toast.error('Error al cargar los idiomas');
      } finally {
        dispatchLanguagesLoadState({ languages: mappedLanguages, isLoadingLanguages: false });
      }
    };

    void loadLanguages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Load tags from API on mount
  useEffect(() => {
    const loadTags = async () => {
      dispatchTagsLoadState({ isLoadingTags: true });
      let resolvedDefaultTags: string[] = [];
      try {
        // Try to get default tags, but don't fail if endpoint doesn't exist
        try {
          const defaultResponse = await tagsAPI.getDefault();
          let defaultTagsArray: Array<{ id?: string; name?: string; display_name?: string }> = [];

          if (Array.isArray(defaultResponse)) {
            defaultTagsArray = defaultResponse;
          } else if (defaultResponse?.data && Array.isArray(defaultResponse.data)) {
            defaultTagsArray = defaultResponse.data;
          } else if (
            defaultResponse?.success &&
            defaultResponse.data &&
            Array.isArray(defaultResponse.data)
          ) {
            defaultTagsArray = defaultResponse.data;
          }

          resolvedDefaultTags = defaultTagsArray.map((t) => t.name || t.display_name || '');
        } catch (error) {
          console.warn('Could not load default tags from API, using fallback:', error);
        }

        // If no default tags from API, use fallback
        if (resolvedDefaultTags.length === 0) {
          resolvedDefaultTags = ['Commander', 'Personal', 'Reestock', 'cEDH Staple'];
        }

        // Don't auto-select default tags - user must select them manually

        // Try to get all active tags, but don't fail if endpoint doesn't exist
        try {
          const activeResponse = await tagsAPI.getActive();
          let activeTagsArray: Array<{ id?: string; name?: string; display_name?: string }> = [];

          if (Array.isArray(activeResponse)) {
            activeTagsArray = activeResponse;
          } else if (activeResponse?.data && Array.isArray(activeResponse.data)) {
            activeTagsArray = activeResponse.data;
          } else if (
            activeResponse?.success &&
            activeResponse.data &&
            Array.isArray(activeResponse.data)
          ) {
            activeTagsArray = activeResponse.data;
          }

          setAvailableTags(
            activeTagsArray.map((t) => ({
              id: t.id ?? '',
              name: t.name ?? '',
              display_name: t.display_name || t.name,
            }))
          );
        } catch (error) {
          console.warn('Could not load active tags from API:', error);
          // Keep availableTags empty, user can still add custom tags
        }
      } catch (error) {
        console.error('Error loading tags:', error);
        // Fallback to hardcoded defaults
        resolvedDefaultTags = ['Commander', 'Personal', 'Reestock', 'cEDH Staple'];
        // Don't auto-select default tags - user must select them manually
      } finally {
        dispatchTagsLoadState({ defaultTags: resolvedDefaultTags, isLoadingTags: false });
      }
    };

    void loadTags();
  }, []); // Only run on mount

  useEffect(() => {
    if (selectedCategory?.id) {
      setFormData((prev) => ({
        ...prev,
        category_id: selectedCategory.id,
      }));
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (conditions.length > 0 && !formData.condition_id) {
      const defaultCondition =
        conditions.find((c) => {
          const name = c.name?.toLowerCase() || '';
          const displayName = c.displayName?.toLowerCase() || '';
          const code = c.code?.toLowerCase() || '';
          return (
            name.includes('near-mint') ||
            name.includes('nearmint') ||
            name.includes('nm') ||
            displayName.includes('near mint') ||
            displayName.includes('near-mint') ||
            code === 'nm'
          );
        }) || conditions[0]; // Fallback to first condition if near mint not found

      if (defaultCondition) {
        setFormData((prev) => ({
          ...prev,
          condition_id: defaultCondition.id,
        }));
      }
    }
  }, [conditions, formData.condition_id]);

  useEffect(() => {
    if (languages.length > 0 && !formData.language_id) {
      const defaultLanguage = languages.find(
        (l) =>
          l.name?.toLowerCase().includes('english') ||
          l.name?.toLowerCase().includes('inglés') ||
          l.displayName?.toLowerCase().includes('english') ||
          l.displayName?.toLowerCase().includes('inglés')
      );
      if (defaultLanguage) {
        setFormData((prev) => ({
          ...prev,
          language_id: defaultLanguage.id,
        }));
      }
    }
  }, [languages, formData.language_id]);

  const isValidUUID = (str: string | undefined | null): boolean => {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const isFormValid = () => {
    if (!selectedCategory || !selectedOwner) {
      return false;
    }

    const checks = {
      cardName: !!(formData.cardName && formData.cardName.trim() !== ''),
      language_id: !!(
        formData.language_id &&
        formData.language_id.trim() !== '' &&
        isValidUUID(formData.language_id)
      ),
      condition_id: !!(
        formData.condition_id &&
        formData.condition_id.trim() !== '' &&
        isValidUUID(formData.condition_id)
      ),
      finalPrice: !!(formData.finalPrice && formData.finalPrice > 0),
    };

    const isValid =
      checks.cardName && checks.language_id && checks.condition_id && checks.finalPrice;

    // Log validation state every time it's checked (but throttle it)
    if (!isValid) {
      console.log('❌ Validation failed: missing required fields', {
        ...checks,
        formData: {
          cardName: formData.cardName,
          language_id: formData.language_id,
          condition_id: formData.condition_id,
          finalPrice: formData.finalPrice,
          isLanguageUUID: formData.language_id ? isValidUUID(formData.language_id) : false,
          isConditionUUID: formData.condition_id ? isValidUUID(formData.condition_id) : false,
        },
      });
    }

    return isValid;
  };

  const handleAddItem = () => {
    // Prevent duplicate submissions
    if (isAddingItemRef.current) {
      console.log('⏭️ Ignoring duplicate add item call');
      return;
    }

    console.log('🔘 Botón Agregar Carta clickeado');
    console.log('📋 Form data:', formData);
    console.log('📋 Form data details:', {
      cardName: formData.cardName,
      condition_id: formData.condition_id,
      language_id: formData.language_id,
      finalPrice: formData.finalPrice,
      img: formData.img,
    });
    console.log('✅ isFormValid():', isFormValid());
    console.log('👤 selectedOwner:', selectedOwner);
    console.log('📁 selectedCategory:', selectedCategory);

    if (!selectedCategory || !selectedOwner) {
      if (!selectedCategory) {
        toast.error('Por favor selecciona una categoría');
      }
      if (!selectedOwner) {
        toast.error('Por favor selecciona un propietario');
      }
      return;
    }

    // Set flag to prevent duplicate submissions
    isAddingItemRef.current = true;

    // Validate required fields with specific messages
    if (!formData.cardName || formData.cardName.trim() === '') {
      toast.error('El nombre de la carta es requerido');
      return;
    }

    if (!formData.condition_id || formData.condition_id.trim() === '') {
      toast.error('Por favor selecciona una condición');
      return;
    }

    if (!formData.language_id || formData.language_id.trim() === '') {
      toast.error('Por favor selecciona un idioma');
      return;
    }

    if (!formData.finalPrice || formData.finalPrice <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    if (formData.condition_id && !isValidUUID(formData.condition_id)) {
      toast.error(
        'La condición seleccionada no es válida. Por favor, selecciona una condición válida.'
      );
      return;
    }
    if (formData.language_id && !isValidUUID(formData.language_id)) {
      toast.error('El idioma seleccionado no es válido. Por favor, selecciona un idioma válido.');
      return;
    }

    // Map from API structure to AddProductData structure
    const itemToAdd: AddProductData = {
      name: formData.cardName || '',
      title: formData.cardName || '',
      price: formData.finalPrice || 0,
      imageUrl: formData.img || '',
      imageUrls: [],
      inStock: formData.stock || 1,
      stockStatus: 'available',
      stockNumber: formData.importationId || undefined,
      tags: formData.tags || [],
      consignmentItem: true,
      commissionRate: selectedOwner?.productCommissionRate || 0.15,
      gameSystem: selectedTcg?.name || 'MAGIC',
      owner: {
        type: 'user',
        id: selectedOwner.id,
        email: selectedOwner.email,
        firstName: selectedOwner.firstName,
        lastName: selectedOwner.lastName,
        name: selectedOwner.name,
        phone: selectedOwner.phone,
      },
      categoryId: selectedCategory.id,
      category: selectedCategory.name,
      conditionId: isValidUUID(formData.condition_id) ? formData.condition_id : undefined,
      languageId: isValidUUID(formData.language_id) ? formData.language_id : undefined,
      expansion: formData.expansion || undefined,
      cardNumber: formData.cardNumber || undefined,
      backupLanguage: 'English',
      importationProductId: (formData.importationId || '').trim() || undefined,
      importationLink: (formData.link || '').trim() || undefined,
      importationId: (formData.importationId || '').trim() || undefined,
      isFoil: formData.foil || false,
      isBorderless: formData.borderless || false,
      surgeFoil: formData.surgeFoil || false,
      extendedArt: formData.extendedArt || false,
      prerelease: formData.prerelease || false,
      premierPlay: formData.premierPlay || false,
      variant: formData.variant || undefined,
    };

    console.log('📤 Item to add:', itemToAdd);
    console.log('📤 Item details:', {
      name: itemToAdd.name,
      price: itemToAdd.price,
      categoryId: itemToAdd.categoryId,
      conditionId: itemToAdd.conditionId,
      languageId: itemToAdd.languageId,
    });

    try {
      onAddItem(itemToAdd);
      console.log('✅ Item agregado al estado');
      toast.success('Carta agregada correctamente');

      // Store importationId before resetting form
      const cardImportationId = itemToAdd.importationId || itemToAdd.importationProductId || null;

      // Reset form immediately - do this synchronously
      // Reset form but keep default condition (near mint) and language if available
      const defaultCondition =
        conditions.find((c) => {
          const name = c.name?.toLowerCase() || '';
          const displayName = c.displayName?.toLowerCase() || '';
          const code = c.code?.toLowerCase() || '';
          return (
            name.includes('near-mint') ||
            name.includes('nearmint') ||
            name.includes('nm') ||
            displayName.includes('near mint') ||
            displayName.includes('near-mint') ||
            code === 'nm'
          );
        }) || conditions[0]; // Fallback to first condition if near mint not found

      const defaultLanguage =
        languages.find(
          (l) =>
            l.name?.toLowerCase().includes('english') ||
            l.name?.toLowerCase().includes('inglés') ||
            l.displayName?.toLowerCase().includes('english') ||
            l.displayName?.toLowerCase().includes('inglés')
        ) || languages[0]; // Fallback to first language if english not found

      setFormData({
        cardName: '',
        cardNumber: '',
        category_id: selectedCategory.id,
        condition_id: defaultCondition?.id || '',
        expansion: '',
        extendedArt: false,
        finalPrice: 0,
        foil: false,
        borderless: false,
        importationId: '',
        img: '',
        language_id: defaultLanguage?.id || '',
        link: '',
        prerelease: false,
        premierPlay: false,
        stock: 1,
        surgeFoil: false,
        tags: [], // Reset to empty - user must select tags manually
        variant: '',
      });
      dispatchSearchUi({ searchQuery: '', showDropdown: false, showImportationResults: false, selectedSuggestion: '', selectedIndex: -1 });

      // Notify that card was added AFTER form is reset (for bulk import flow)
      // Use requestAnimationFrame to ensure form is cleared before notification
      requestAnimationFrame(() => {
        if (onCardAdded) {
          onCardAdded(cardImportationId);
        }
        // Reset flag after a short delay to allow form reset
        setTimeout(() => {
          isAddingItemRef.current = false;
        }, 500);
      });
    } catch (error) {
      console.error('❌ Error al agregar item:', error);
      toast.error('Error al agregar la carta al estado');
      // Reset flag on error
      isAddingItemRef.current = false;
    }
  };

  const imageUrl = formData.img || '';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Agregar Nueva Carta</h3>
          <div className="flex items-center gap-2">
            {!isFormValid() && (
              <div className="text-xs text-muted-foreground">
                {!formData.cardName && 'Nombre '}
                {!formData.condition_id && 'Condición '}
                {!formData.language_id && 'Idioma '}
                {(!formData.finalPrice || formData.finalPrice <= 0) && 'Precio '}
                {(!selectedCategory || !selectedOwner) && 'Propietario/Categoría '}
              </div>
            )}
            <Button
              onClick={handleAddItem}
              disabled={!isFormValid() || isSubmitting}
              variant="outline"
              title={
                !isFormValid()
                  ? `Completa: ${!formData.cardName ? 'Nombre, ' : ''}${
                      !formData.condition_id ? 'Condición, ' : ''
                    }${!formData.language_id ? 'Idioma, ' : ''}${
                      !formData.finalPrice || formData.finalPrice <= 0 ? 'Precio' : ''
                    }`
                  : 'Agregar carta al inventario'
              }
            >
              <Add24Regular className="size-4 mr-2" />
              Agregar Carta
            </Button>
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Categoría seleccionada:</strong>{' '}
            {selectedCategory.displayName || selectedCategory.name}
          </p>
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs text-blue-600 dark:text-blue-400 underline mt-1"
          >
            Cambiar categoría
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SinglesSearch
              autocompleteRef={autocompleteRef}
              searchQuery={searchQuery}
              handleSearchChange={handleSearchChange}
              isSubmitting={isSubmitting}
              handleKeyDown={handleKeyDown}
              suggestions={suggestions}
              show={{
                importationResults: showImportationResults,
                camera: showCamera,
                dropdown: showDropdown,
              }}
              setShowDropdown={(val) => dispatchSearchUi({ showDropdown: val })}
              searchMode={searchMode}
              setShowCamera={(val) => dispatchSearchUi({ showCamera: val })}
              selectedSuggestion={selectedSuggestion}
              importationResults={importationResults}
              handleImportationCardSelect={handleImportationCardSelect}
              handleSuggestionSelect={handleSuggestionSelect}
              selectedIndex={selectedIndex}
              importationFilters={importationFilters}
              onFiltersChange={(newFilters) => {
                onImportationFiltersChange?.(newFilters);
                // Re-search with new filters if there's an active query
                if (selectedSuggestion && onSearchImportation) {
                  onSearchImportation(selectedSuggestion, newFilters);
                }
              }}
            />

            <SinglesBasicInfo
              formData={formData}
              setFormData={setFormData}
              validationErrors={validationErrors}
              isSubmitting={isSubmitting}
              conditions={conditions}
              isLoadingConditions={isLoadingConditions}
              languages={languages}
              isLoadingLanguages={isLoadingLanguages}
              defaultTags={defaultTags}
              newTagInput={newTagInput}
              setNewTagInput={setNewTagInput}
              formConfig={
                selectedCategory?.form_config as
                  | { fields: Record<string, { enabled: boolean; label?: string }> }
                  | undefined
              }
            />

            <SinglesImages
              formData={formData}
              setFormData={setFormData}
              isSubmitting={isSubmitting}
            />

            <div className="mt-6 flex justify-end items-center gap-2">
              {!isFormValid() && (
                <div className="text-xs text-muted-foreground">
                  Faltan: {!formData.cardName && 'Nombre '}
                  {(!formData.condition_id || !isValidUUID(formData.condition_id)) && 'Condición '}
                  {(!formData.language_id || !isValidUUID(formData.language_id)) && 'Idioma '}
                  {(!formData.finalPrice || formData.finalPrice <= 0) && 'Precio '}
                </div>
              )}
              <Button
                onClick={handleAddItem}
                disabled={!isFormValid() || isSubmitting}
                variant="outline"
                title={
                  !isFormValid()
                    ? `Completa: ${!formData.cardName ? 'Nombre, ' : ''}${
                        !formData.condition_id || !isValidUUID(formData.condition_id)
                          ? 'Condición, '
                          : ''
                      }${
                        !formData.language_id || !isValidUUID(formData.language_id)
                          ? 'Idioma, '
                          : ''
                      }${!formData.finalPrice || formData.finalPrice <= 0 ? 'Precio' : ''}`
                    : 'Agregar carta al inventario'
                }
              >
                <Add24Regular className="size-4 mr-2" />
                Agregar Carta
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {showCamera && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <CameraScanner
                    onTextDetected={(text) => {
                      const cleanText = text.split(/[\n\r]/)[0].trim();
                      if (cleanText) {
                        handleSuggestionSelect(cleanText);
                        toast.success('Texto pegado en búsqueda');
                      }
                    }}
                    className="w-full shadow-lg border-2 border-primary/20"
                  />
                </div>
              )}
              <ProductFormPreview
                imageUrl={imageUrl}
                cardName={formData.cardName || ''}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
