'use client';

import { useCallback, useEffect, useRef, useReducer } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cardSearchAPI } from '@/lib/api';
import type { AddProductData, Category, Condition, Language, User, ImportationCard } from './types';
import { toast } from 'sonner';

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
  isProcessed?: boolean; // Track if this card has been added to the list
}

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (event: unknown, data: { open: boolean }) => void;
  selectedCategory: Category | null;
  selectedOwner: User | null;
  conditions: Condition[];
  languages: Language[];
  onAddItems: (items: AddProductData[]) => void;
  onAddPendingItem?: (item: AddProductData) => void;
  onSelectCardForForm?: (card: ImportationCard) => void;
  onCardAdded?: () => void;
  currentImportationId?: string | null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface BulkImportTextInputProps {
  bulkText: string;
  onChange: (text: string) => void;
  isProcessing: boolean;
  processedCount: number;
  parsedCardsLength: number;
  onProcess: () => void;
}

function BulkImportTextInput({
  bulkText,
  onChange,
  isProcessing,
  processedCount,
  parsedCardsLength,
  onProcess,
}: BulkImportTextInputProps) {
  return (
    <>
      <div>
        <Label htmlFor="bulk-text">Texto de las cartas</Label>
        <Textarea
          id="bulk-text"
          value={bulkText}
          onChange={(e) => onChange(e.target.value)}
          placeholder="1 Aminatou, Veil Piercer&#10;1 Lightning Bolt (M21) 158 *F*&#10;2 Counterspell (M21) 53"
          className="min-h-[200px] font-mono"
        />
      </div>
      <Button
        onClick={onProcess}
        disabled={isProcessing || !bulkText.trim()}
        className="w-full"
      >
        {isProcessing
          ? `Procesando... (${processedCount}/${parsedCardsLength})`
          : 'Procesar Cartas'}
      </Button>
    </>
  );
}

function AllProcessedBanner() {
  return (
    <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
      <div className="text-center">
        <div className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
          ✓ Todas las cartas han sido procesadas
        </div>
        <div className="text-sm text-green-600 dark:text-green-300">
          Puedes cerrar este modal o procesar más cartas
        </div>
      </div>
    </div>
  );
}

interface CardSearchResultItemProps {
  result: CardSearchResult;
  index: number;
  onSelectCard: (index: number, card: ImportationCard) => void;
  onSkipCard: (index: number) => void;
}

function CardSearchResultItem({ result, index, onSelectCard, onSkipCard }: CardSearchResultItemProps) {
  return (
    <Card key={`card-${result.parsedCard.originalLine}`}>
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="text-lg font-semibold mb-2">
            {result.parsedCard.quantity}x {result.parsedCard.name}
            {result.parsedCard.setCode && <span> ({result.parsedCard.setCode})</span>}
            {result.parsedCard.cardNumber && (
              <span className="ml-2 text-blue-600 font-medium">
                #{result.parsedCard.cardNumber}
              </span>
            )}
            {result.parsedCard.isFoil && (
              <span className="ml-2 text-yellow-600 font-bold">*FOIL*</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {result.parsedCard.originalLine}
          </div>
        </div>

        {result.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {result.error && (
          <div className="space-y-3 mt-6">
            <div className="text-sm text-red-600 p-4 bg-red-50 dark:bg-red-900/20 rounded">
              {result.error}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSkipCard(index)}
              className="w-full text-muted-foreground"
            >
              Saltar esta carta y continuar
            </Button>
          </div>
        )}

        {result.results.length > 0 && !result.selectedCard && (
          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-base font-medium">Selecciona una carta:</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSkipCard(index)}
                className="text-muted-foreground"
              >
                Saltar esta carta
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto">
              {result.results.map((card: ImportationCard) => {
                const isFoil =
                  result.parsedCard.isFoil || card.foil || card.isFoil || false;
                const isBorderless = card.borderless || card.isBorderless || false;
                const isPrerelease = card.prerelease || false;
                const isExtendedArt = card.extendedArt || false;
                const isSurgeFoil = card.surgeFoil || false;
                const cardNumber =
                  card.cardNumber || result.parsedCard.cardNumber || '';
                const cardLanguage = card.language || 'Inglés';

                const extractPrice = (priceString: string | number | undefined) => {
                  if (!priceString) return 0;
                  if (typeof priceString === 'number') return priceString;
                  const match = String(priceString).match(/[\d,]+\.?\d*/);
                  return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
                };

                const cardPrice =
                  extractPrice(card.finalPrice) ||
                  extractPrice(card.price) ||
                  extractPrice(card.formattedPrice) ||
                  0;

                return (
                  <Button
                    key={card.importationId || card.productId || card.id}
                    variant="outline"
                    size="lg"
                    className="w-full justify-start h-auto p-5 hover:bg-accent"
                    onClick={() => onSelectCard(index, card)}
                  >
                    <div className="flex items-center gap-5 w-full">
                      {card.img || card.imageUrl ? (
                        <Image
                          src={card.img || card.imageUrl || ''}
                          alt={card.cardName || card.name || ''}
                          width={160}
                          height={224}
                          className="w-40 h-56 object-cover rounded border-2"
                        />
                      ) : (
                        <div className="w-40 h-56 bg-neutral-200 dark:bg-neutral-700 rounded border-2 flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">
                            Sin imagen
                          </span>
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-bold text-lg mb-2">
                          {card.cardName || card.name || card.title}
                        </div>
                        <div className="space-y-1">
                          <div className="text-base text-muted-foreground">
                            {String(
                              card.expansion ||
                                card.setCode ||
                                result.parsedCard.setCode ||
                                ''
                            )}
                          </div>
                          {cardNumber && (
                            <div className="text-base font-semibold text-blue-600">
                              Número: {cardNumber}
                            </div>
                          )}
                          <div className="text-base font-medium text-green-600">
                            Idioma: {cardLanguage}
                          </div>
                          {cardPrice > 0 && (
                            <div className="text-base font-bold text-emerald-600">
                              Precio: ${cardPrice.toFixed(2)}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {isFoil && (
                              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-bold">
                                FOIL
                              </span>
                            )}
                            {isBorderless && (
                              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm font-bold">
                                BORDERLESS
                              </span>
                            )}
                            {isPrerelease && (
                              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full text-sm font-bold">
                                PRERELEASE
                              </span>
                            )}
                            {isExtendedArt && (
                              <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 rounded-full text-sm font-bold">
                                EXTENDED ART
                              </span>
                            )}
                            {isSurgeFoil && (
                              <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 rounded-full text-sm font-bold">
                                SURGE FOIL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {result.selectedCard && (
          <div className="mt-6 space-y-3">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
              <div className="text-base font-semibold text-green-800 dark:text-green-200 mb-2">
                ✓ Carta seleccionada - Puedes editar los detalles en el formulario
              </div>
              <div className="text-sm text-green-600 dark:text-green-300">
                {result.selectedCard.cardName ||
                  result.selectedCard.name ||
                  result.selectedCard.title}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSkipCard(index)}
              className="w-full text-muted-foreground"
            >
              Saltar esta carta y continuar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BulkImportDialog({
  open,
  onOpenChange,
  selectedCategory,
  selectedOwner,
  onSelectCardForForm,
  onCardAdded,
  currentImportationId,
}: BulkImportDialogProps) {
  type BulkState = {
    bulkText: string;
    parsedCards: ParsedCard[];
    searchResults: CardSearchResult[];
    isProcessing: boolean;
    processedCount: number;
  };
  const [bulkState, dispatchBulk] = useReducer(
    (s: BulkState, a: Partial<BulkState> | ((prev: BulkState) => BulkState)): BulkState =>
      typeof a === 'function' ? a(s) : { ...s, ...a },
    { bulkText: '', parsedCards: [], searchResults: [], isProcessing: false, processedCount: 0 }
  );
  const { bulkText, parsedCards, searchResults, isProcessing, processedCount } = bulkState;
  const currentProcessingIndexRef = useRef(-1);
  const lastSelectedCardIdRef = useRef<string | null>(null);

  // Mark card as processed when it's added to the list
  useEffect(() => {
    if (currentImportationId && lastSelectedCardIdRef.current === currentImportationId) {
      dispatchBulk((prev) => ({
        ...prev,
        searchResults: prev.searchResults.map((result) => {
          if (
            (result.selectedCard?.importationId ||
              result.selectedCard?.productId ||
              result.selectedCard?.id) === currentImportationId
          ) {
            return { ...result, processed: true };
          }
          return result;
        }),
      }));

      lastSelectedCardIdRef.current = null;

      if (onCardAdded) {
        onCardAdded();
      }
    }
  }, [currentImportationId, onCardAdded]);

  const parseBulkText = useCallback((text: string): ParsedCard[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    const parsed: ParsedCard[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Pattern 1: 1 Card Name (SET) 123 or 1 Card Name (SET) 123 *F*
      const matchWithNumber = trimmed.match(/^(\d+)\s+(.+?)\s+\(([^)]+)\)\s+(\d+)(?:\s+\*F\*)?$/);

      if (matchWithNumber) {
        const quantity = parseInt(matchWithNumber[1], 10);
        const name = matchWithNumber[2].trim();
        const setCode = matchWithNumber[3].trim();
        const cardNumber = matchWithNumber[4].trim();
        const isFoil = trimmed.includes('*F*');

        parsed.push({
          quantity,
          name,
          setCode,
          cardNumber,
          isFoil,
          originalLine: trimmed,
          lineIndex: index,
        });
        return;
      }

      // Pattern 2: 1 Card Name (SET) or 1 Card Name (SET) *F*
      const matchWithSet = trimmed.match(/^(\d+)\s+(.+?)\s+\(([^)]+)\)(?:\s+\*F\*)?$/);

      if (matchWithSet) {
        const quantity = parseInt(matchWithSet[1], 10);
        const name = matchWithSet[2].trim();
        const setCode = matchWithSet[3].trim();
        const isFoil = trimmed.includes('*F*');

        parsed.push({
          quantity,
          name,
          setCode,
          cardNumber: '',
          isFoil,
          originalLine: trimmed,
          lineIndex: index,
        });
        return;
      }

      // Pattern 3: Simple format - 1 Card Name
      const simpleMatch = trimmed.match(/^(\d+)\s+(.+)$/);

      if (simpleMatch) {
        const quantity = parseInt(simpleMatch[1], 10);
        const name = simpleMatch[2].trim();

        parsed.push({
          quantity,
          name,
          setCode: '',
          cardNumber: '',
          isFoil: false,
          originalLine: trimmed,
          lineIndex: index,
        });
        return;
      }
    });

    return parsed;
  }, []);

  const searchCard = useCallback(async (parsedCard: ParsedCard): Promise<ImportationCard[]> => {
    try {
      let searchQuery = parsedCard.name;
      if (parsedCard.setCode) {
        searchQuery += ` ${parsedCard.setCode}`;
      }
      if (parsedCard.cardNumber) {
        searchQuery += ` ${parsedCard.cardNumber}`;
      }
      searchQuery = searchQuery.trim();
      const response = await cardSearchAPI.search(searchQuery, 1, 60);

      let cards: ImportationCard[] = [];

      if (Array.isArray(response)) {
        cards = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          cards = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          cards = response.data.data;
        }
      } else if (response?.success && response.data) {
        cards = Array.isArray(response.data) ? response.data : [];
      }

      return cards as ImportationCard[];
    } catch (error) {
      console.error('Error searching card:', error);
      return [];
    }
  }, []);

  const handleProcessBulk = useCallback(async () => {
    if (!bulkText.trim()) {
      toast.error('Por favor ingresa el texto de las cartas');
      return;
    }

    if (!selectedCategory) {
      toast.error('Por favor selecciona una categoría primero');
      return;
    }

    if (!selectedOwner) {
      toast.error('Por favor selecciona un propietario primero');
      return;
    }

    const parsed = parseBulkText(bulkText);
    if (parsed.length === 0) {
      toast.error('No se pudieron parsear las cartas. Verifica el formato.');
      return;
    }

    dispatchBulk({ parsedCards: parsed, processedCount: 0, isProcessing: true, searchResults: parsed.map((card) => ({
      parsedCard: card,
      searchQuery: '',
      results: [],
      isLoading: false,
      selectedCard: null,
      error: null,
    })) });

    // Process all cards concurrently
    await Promise.all(
      parsed.map(async (parsedCard, resultIndex) => {
        currentProcessingIndexRef.current = resultIndex;

        dispatchBulk((prev) => {
          const updated = [...prev.searchResults];
          let searchQuery = parsedCard.name;
          if (parsedCard.setCode) {
            searchQuery += ` ${parsedCard.setCode}`;
          }
          updated[resultIndex] = { ...updated[resultIndex], isLoading: true, searchQuery };
          return { ...prev, searchResults: updated };
        });

        try {
          const cards = await searchCard(parsedCard);
          dispatchBulk((prev) => {
            const updated = [...prev.searchResults];
            updated[resultIndex] = {
              ...updated[resultIndex],
              isLoading: false,
              results: cards,
              error: cards.length === 0 ? 'No se encontraron resultados' : null,
            };
            return { ...prev, searchResults: updated };
          });
        } catch {
          dispatchBulk((prev) => {
            const updated = [...prev.searchResults];
            updated[resultIndex] = { ...updated[resultIndex], isLoading: false, error: 'Error al buscar la carta' };
            return { ...prev, searchResults: updated };
          });
        }
      })
    );
    dispatchBulk({ processedCount: parsed.length, isProcessing: false });
    currentProcessingIndexRef.current = -1;
  }, [bulkText, parseBulkText, searchCard, selectedCategory, selectedOwner]);

  // Track last selected card to prevent duplicate selections
  const lastSelectedCardRef = useRef<string | null>(null);
  const lastSelectionTimeRef = useRef<number>(0);

  const handleSelectCard = useCallback(
    async (resultIndex: number, card: ImportationCard) => {
      const result = searchResults[resultIndex];
      if (!result) return;

      // Store the card ID to track which one was selected
      const cardId = card.importationId || card.productId || card.id;
      const now = Date.now();

      // Prevent duplicate selections of the same card
      if (lastSelectedCardRef.current === cardId && now - lastSelectionTimeRef.current < 500) {
        console.log('⏭️ Ignoring duplicate card selection:', cardId);
        return;
      }

      lastSelectedCardRef.current = cardId ?? null;
      lastSelectionTimeRef.current = now;
      lastSelectedCardIdRef.current = cardId ?? null;

      // Add quantity and foil info from parsed card to the card object
      console.log('🔍 [BULK IMPORT] ========== CARD SELECTION START ==========');
      console.log('🔍 [BULK IMPORT] Parsed card data:', {
        parsedCardIsFoil: result.parsedCard.isFoil,
        parsedCardIsFoilType: typeof result.parsedCard.isFoil,
        parsedCardName: result.parsedCard.name,
        parsedCardQuantity: result.parsedCard.quantity,
        cardOriginalFoil: card.foil,
        cardOriginalIsFoil: card.isFoil,
      });

      // IMPORTANT: Put bulkIsFoil AFTER the spread to ensure it's not overwritten
      // Also ensure it's always a boolean, even if parsedCard.isFoil is undefined
      // Explicitly check if isFoil is true, otherwise set to false
      const bulkIsFoilValue = result.parsedCard.isFoil === true ? true : false;

      const cardWithBulkData = {
        ...card,
        bulkQuantity: result.parsedCard.quantity,
        bulkSetCode: result.parsedCard.setCode,
        // Set bulkIsFoil AFTER spread to ensure it takes priority
        // Always set as explicit boolean (true or false, never undefined)
        bulkIsFoil: bulkIsFoilValue,
      };

      console.log('🔍 [BULK IMPORT] Setting bulkIsFoil:', {
        parsedCardIsFoil: result.parsedCard.isFoil,
        parsedCardIsFoilType: typeof result.parsedCard.isFoil,
        bulkIsFoilValue: bulkIsFoilValue,
        bulkIsFoilType: typeof bulkIsFoilValue,
      });

      console.log('🔍 [BULK IMPORT] Card with bulk data (FULL OBJECT):', cardWithBulkData);
      console.log('🔍 [BULK IMPORT] Card with bulk data (SUMMARY):', {
        name: cardWithBulkData.name || cardWithBulkData.title || cardWithBulkData.cardName,
        importationId:
          cardWithBulkData.importationId || cardWithBulkData.productId || cardWithBulkData.id,
        bulkQuantity: cardWithBulkData.bulkQuantity,
        bulkIsFoil: cardWithBulkData.bulkIsFoil,
        bulkIsFoilType: typeof cardWithBulkData.bulkIsFoil,
        hasBulkIsFoil: 'bulkIsFoil' in cardWithBulkData,
        foil: cardWithBulkData.foil,
        isFoil: cardWithBulkData.isFoil,
        allKeys: Object.keys(cardWithBulkData),
      });

      // Populate the form with this card data
      // IMPORTANT: This only populates the form, it does NOT add the card to the list
      // The user must click "Agregar Carta" button in the form to add it
      if (onSelectCardForForm) {
        console.log('🔄 [BULK IMPORT] Calling onSelectCardForForm with card:', {
          name: cardWithBulkData.name || cardWithBulkData.title,
          importationId: cardWithBulkData.importationId || cardWithBulkData.productId,
          bulkQuantity: cardWithBulkData.bulkQuantity,
          bulkIsFoil: cardWithBulkData.bulkIsFoil,
          bulkIsFoilType: typeof cardWithBulkData.bulkIsFoil,
          foil: cardWithBulkData.foil,
          isFoil: cardWithBulkData.isFoil,
        });
        console.log('🔄 [BULK IMPORT] Full card object being passed:', cardWithBulkData);
        console.log(
          "🔄 [BULK IMPORT] NOTE: This only populates the form. User must click 'Agregar Carta' to add it."
        );
        console.log(
          '⭐ [FOIL STATUS] Card selected - IS FOIL:',
          cardWithBulkData.bulkIsFoil === true,
          '| Value:',
          cardWithBulkData.bulkIsFoil,
          '| Type:',
          typeof cardWithBulkData.bulkIsFoil
        );
        console.log(
          '⭐ [FOIL STATUS] Parsed card isFoil:',
          result.parsedCard.isFoil,
          '| bulkIsFoilValue:',
          bulkIsFoilValue
        );

        // Ensure bulkIsFoil is explicitly passed
        const cardToPass = {
          ...cardWithBulkData,
          bulkIsFoil: bulkIsFoilValue, // Explicitly set again to ensure it's not lost
        };

        console.log(
          '⭐ [FOIL STATUS] Final card being passed - bulkIsFoil:',
          cardToPass.bulkIsFoil
        );
        onSelectCardForForm(cardToPass);
      } else {
        console.error('❌ onSelectCardForForm is not defined!');
      }
      console.log('🔍 [BULK IMPORT] ========== CARD SELECTION END ==========');

      // Mark as selected (this is just for UI feedback, doesn't add to list)
      dispatchBulk((prev) => {
        const updated = [...prev.searchResults];
        updated[resultIndex] = { ...updated[resultIndex], selectedCard: card };
        return { ...prev, searchResults: updated };
      });

      // Close modal so user can add the card to the form
      // When they reopen, the next unprocessed card will be shown
      onOpenChange(null, { open: false });
    },
    [searchResults, onSelectCardForForm, onOpenChange]
  );

  const handleSkipCard = useCallback(
    (resultIndex: number) => {
      // Mark this card as processed without selecting any version
      dispatchBulk((prev) => {
        const updated = [...prev.searchResults];
        updated[resultIndex] = { ...updated[resultIndex], isProcessed: true };
        return { ...prev, searchResults: updated };
      });

      // Close modal so when reopened, the next unprocessed card will be shown
      onOpenChange(null, { open: false });
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importación Masiva</DialogTitle>
          <DialogDescription>
            Pega el texto de las cartas. Formatos soportados:
            <br />
            • Simple: 1 Card Name
            <br />
            • Con set: 1 Card Name (SET)
            <br />• Completo: 1 Card Name (SET) 123 *F* (el *F* indica que es foil)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Only show textarea and process button if no results have been loaded yet */}
          {searchResults.length === 0 && (
            <BulkImportTextInput
              bulkText={bulkText}
              onChange={(text) => dispatchBulk({ bulkText: text })}
              isProcessing={isProcessing}
              processedCount={processedCount}
              parsedCardsLength={parsedCards.length}
              onProcess={handleProcessBulk}
            />
          )}

          {!isProcessing &&
            searchResults.length > 0 &&
            (() => {
              // Find the first unprocessed card (including cards with errors or no results)
              const firstUnprocessedIndex = searchResults.findIndex(
                (result) => !result.isProcessed
              );

              // If all cards are processed, show a message
              if (firstUnprocessedIndex === -1) {
                const allProcessed = searchResults.every((r) => r.isProcessed);
                if (allProcessed) {
                  return <AllProcessedBanner />;
                }
              }

              // Show only the first unprocessed card
              const result =
                firstUnprocessedIndex >= 0
                  ? searchResults[firstUnprocessedIndex]
                  : searchResults[0];
              const index = firstUnprocessedIndex >= 0 ? firstUnprocessedIndex : 0;

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                      Carta {index + 1} de {searchResults.length}
                    </h3>
                    {searchResults.filter((r) => r.isProcessed).length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {searchResults.filter((r) => r.isProcessed).length} procesada(s)
                      </span>
                    )}
                  </div>
                  <CardSearchResultItem
                    result={result}
                    index={index}
                    onSelectCard={handleSelectCard}
                    onSkipCard={handleSkipCard}
                  />
                </div>
              );
            })()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(null, { open: false })}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
