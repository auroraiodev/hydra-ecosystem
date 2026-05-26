'use client';

import { useReducer, useCallback, useRef } from 'react';
import { cardSearchAPI } from '@/lib/api';
import { toast } from 'sonner';
import type { ImportationCard, Category, User } from '../types';

interface ParsedCard {
  quantity: number;
  name: string;
  setCode: string;
  cardNumber: string;
  isFoil: boolean;
  originalLine: string;
  lineIndex: number;
}

interface CardSearchResult {
  parsedCard: ParsedCard;
  searchQuery: string;
  results: ImportationCard[];
  isLoading: boolean;
  selectedCard: ImportationCard | null;
  error: string | null;
  isProcessed?: boolean;
}

interface BulkImportState {
  bulkText: string;
  parsedCards: ParsedCard[];
  searchResults: CardSearchResult[];
  isProcessing: boolean;
  processedCount: number;
}

const initialState: BulkImportState = {
  bulkText: '',
  parsedCards: [],
  searchResults: [],
  isProcessing: false,
  processedCount: 0,
};

type BulkImportAction =
  | { type: 'SET_BULK_TEXT'; payload: string }
  | { type: 'SET_PARSED_CARDS'; payload: ParsedCard[] }
  | { type: 'SET_SEARCH_RESULTS'; payload: CardSearchResult[] }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_PROCESSED_COUNT'; payload: number }
  | { type: 'SET_SEARCH_RESULT_LOADING'; payload: { index: number; searchQuery: string } }
  | { type: 'SET_SEARCH_RESULT_COMPLETE'; payload: { index: number; cards: ImportationCard[] } }
  | { type: 'SET_SEARCH_RESULT_ERROR'; payload: { index: number; error: string } }
  | { type: 'SET_SEARCH_RESULT_SELECTED'; payload: { index: number; card: ImportationCard } }
  | { type: 'SET_SEARCH_RESULT_SKIPPED'; payload: { index: number } };

function bulkImportReducer(state: BulkImportState, action: BulkImportAction): BulkImportState {
  switch (action.type) {
    case 'SET_BULK_TEXT': return { ...state, bulkText: action.payload };
    case 'SET_PARSED_CARDS': return { ...state, parsedCards: action.payload };
    case 'SET_SEARCH_RESULTS': return { ...state, searchResults: action.payload };
    case 'SET_PROCESSING': return { ...state, isProcessing: action.payload };
    case 'SET_PROCESSED_COUNT': return { ...state, processedCount: action.payload };
    case 'SET_SEARCH_RESULT_LOADING': {
      const updated = [...state.searchResults];
      updated[action.payload.index] = { ...updated[action.payload.index], isLoading: true, searchQuery: action.payload.searchQuery };
      return { ...state, searchResults: updated };
    }
    case 'SET_SEARCH_RESULT_COMPLETE': {
      const updated = [...state.searchResults];
      updated[action.payload.index] = {
        ...updated[action.payload.index],
        isLoading: false,
        results: action.payload.cards,
        error: action.payload.cards.length === 0 ? 'No se encontraron resultados' : null,
      };
      return { ...state, searchResults: updated };
    }
    case 'SET_SEARCH_RESULT_ERROR': {
      const updated = [...state.searchResults];
      updated[action.payload.index] = { ...updated[action.payload.index], isLoading: false, error: action.payload.error };
      return { ...state, searchResults: updated };
    }
    case 'SET_SEARCH_RESULT_SELECTED': {
      const updated = [...state.searchResults];
      updated[action.payload.index] = { ...updated[action.payload.index], selectedCard: action.payload.card };
      return { ...state, searchResults: updated };
    }
    case 'SET_SEARCH_RESULT_SKIPPED': {
      const updated = [...state.searchResults];
      updated[action.payload.index] = { ...updated[action.payload.index], isProcessed: true };
      return { ...state, searchResults: updated };
    }
    default: return state;
  }
}

export function useBulkImportManager({
  selectedCategory,
  selectedOwner,
  tax,
  profit,
  onSelectCardForForm,
  onOpenChange,
}: {
  selectedCategory: Category | null;
  selectedOwner: User | null;
  tax: number;
  profit: number;
  onSelectCardForForm?: (card: ImportationCard) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, dispatch] = useReducer(bulkImportReducer, initialState);
  const lastSelectedCardRef = useRef<string | null>(null);
  const lastSelectionTimeRef = useRef<number>(0);

  const parseBulkText = useCallback((text: string): ParsedCard[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    const parsed: ParsedCard[] = [];
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const matchWithNumber = trimmed.match(/^(\d+)\s+(.+?)\s+\(([^)]+)\)\s+(\d+)(?:\s+\*F\*)?$/);
      if (matchWithNumber) {
        parsed.push({
          quantity: parseInt(matchWithNumber[1], 10),
          name: matchWithNumber[2].trim(),
          setCode: matchWithNumber[3].trim(),
          cardNumber: matchWithNumber[4].trim(),
          isFoil: trimmed.includes('*F*'),
          originalLine: trimmed,
          lineIndex: index,
        });
        return;
      }
      const matchWithSet = trimmed.match(/^(\d+)\s+(.+?)\s+\(([^)]+)\)(?:\s+\*F\*)?$/);
      if (matchWithSet) {
        parsed.push({
          quantity: parseInt(matchWithSet[1], 10),
          name: matchWithSet[2].trim(),
          setCode: matchWithSet[3].trim(),
          cardNumber: '',
          isFoil: trimmed.includes('*F*'),
          originalLine: trimmed,
          lineIndex: index,
        });
        return;
      }
      const simpleMatch = trimmed.match(/^(\d+)\s+(.+)$/);
      if (simpleMatch) {
        parsed.push({
          quantity: parseInt(simpleMatch[1], 10),
          name: simpleMatch[2].trim(),
          setCode: '',
          cardNumber: '',
          isFoil: false,
          originalLine: trimmed,
          lineIndex: index,
        });
      }
    });
    return parsed;
  }, []);

  const searchCard = useCallback(async (parsedCard: ParsedCard): Promise<ImportationCard[]> => {
    try {
      let searchQuery = parsedCard.name;
      if (parsedCard.setCode) searchQuery += ` ${parsedCard.setCode}`;
      if (parsedCard.cardNumber) searchQuery += ` ${parsedCard.cardNumber}`;
      searchQuery = searchQuery.trim();
      const response = await cardSearchAPI.search(searchQuery, 1, 60, { tax, profit });
      let cards: ImportationCard[] = [];
      if (Array.isArray(response)) cards = response;
      else if (response?.data) {
        if (Array.isArray(response.data)) cards = response.data;
        else if (response.data?.data && Array.isArray(response.data.data)) cards = response.data.data;
      } else if (response?.success && response.data) cards = Array.isArray(response.data) ? response.data : [];
      return cards as ImportationCard[];
    } catch (error) {
      console.error('Error searching card:', error);
      return [];
    }
  }, [tax, profit]);

  const handleProcessBulk = useCallback(async () => {
    if (!state.bulkText.trim()) { toast.error('Por favor ingresa el texto de las cartas'); return; }
    if (!selectedCategory) { toast.error('Por favor selecciona una categoría primero'); return; }
    if (!selectedOwner) { toast.error('Por favor selecciona un propietario primero'); return; }

    const parsed = parseBulkText(state.bulkText);
    if (parsed.length === 0) { toast.error('No se pudieron parsear las cartas. Verifica el formato.'); return; }

    dispatch({ type: 'SET_PARSED_CARDS', payload: parsed });
    dispatch({ type: 'SET_PROCESSED_COUNT', payload: 0 });
    dispatch({ type: 'SET_PROCESSING', payload: true });

    const results: CardSearchResult[] = parsed.map((card) => ({
      parsedCard: card, searchQuery: '', results: [], isLoading: false, selectedCard: null, error: null,
    }));
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });

    await Promise.all(parsed.map(async (parsedCard, resultIndex) => {
      let searchQuery = parsedCard.name;
      if (parsedCard.setCode) searchQuery += ` ${parsedCard.setCode}`;
      dispatch({ type: 'SET_SEARCH_RESULT_LOADING', payload: { index: resultIndex, searchQuery } });
      try {
        const cards = await searchCard(parsedCard);
        dispatch({ type: 'SET_SEARCH_RESULT_COMPLETE', payload: { index: resultIndex, cards } });
      } catch {
        dispatch({ type: 'SET_SEARCH_RESULT_ERROR', payload: { index: resultIndex, error: 'Error al buscar la carta' } });
      }
    }));
    dispatch({ type: 'SET_PROCESSED_COUNT', payload: parsed.length });
    dispatch({ type: 'SET_PROCESSING', payload: false });
  }, [state.bulkText, parseBulkText, searchCard, selectedCategory, selectedOwner]);

  const handleSelectCard = useCallback(async (resultIndex: number, card: ImportationCard) => {
    const result = state.searchResults[resultIndex];
    if (!result) return;
    const cardId = card.importationId || card.productId || card.id;
    const now = Date.now();
    if (lastSelectedCardRef.current === cardId && now - lastSelectionTimeRef.current < 500) return;

    lastSelectedCardRef.current = cardId ?? null;
    lastSelectionTimeRef.current = now;

    const bulkIsFoilValue = result.parsedCard.isFoil === true;
    const cardToPass = { ...card, bulkQuantity: result.parsedCard.quantity, bulkSetCode: result.parsedCard.setCode, bulkIsFoil: bulkIsFoilValue };

    if (onSelectCardForForm) onSelectCardForForm(cardToPass);
    dispatch({ type: 'SET_SEARCH_RESULT_SELECTED', payload: { index: resultIndex, card } });
    onOpenChange(false);
  }, [state.searchResults, onSelectCardForForm, onOpenChange]);

  const handleSkipCard = useCallback((resultIndex: number) => {
    dispatch({ type: 'SET_SEARCH_RESULT_SKIPPED', payload: { index: resultIndex } });
    onOpenChange(false);
  }, [onOpenChange]);

  return {
    state,
    dispatch,
    handleProcessBulk,
    handleSelectCard,
    handleSkipCard,
  };
}
