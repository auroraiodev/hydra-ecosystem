'use client';

import { useMemo } from 'react';
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
import type { AddProductData, Category, Condition, Language, User, ImportationCard } from './types';
import { BulkImportCardItem } from './components/BulkImportCardItem';

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
  onOpenChange: (open: boolean) => void;
  selectedCategory: Category | null;
  selectedOwner: User | null;
  conditions: Condition[];
  languages: Language[];
  onAddItems: (items: AddProductData[]) => void;
  onAddPendingItem?: (item: AddProductData) => void;
  onSelectCardForForm?: (card: ImportationCard) => void;
  addedIds?: Set<string>;
  tax?: number;
  profit?: number;
  onCardAdded?: () => void;
}

import { useBulkImportManager } from './hooks/useBulkImportManager';
export function BulkImportDialog({
  open,
  onOpenChange,
  selectedCategory,
  selectedOwner,
  onSelectCardForForm,
  onCardAdded: _onCardAdded,
  addedIds = new Set(),
  tax = 0.2,
  profit = 0.2,
}: BulkImportDialogProps) {
  const {
    state,
    dispatch,
    handleProcessBulk,
    handleSelectCard,
    handleSkipCard,
  } = useBulkImportManager({
    selectedCategory,
    selectedOwner,
    tax,
    profit,
    onSelectCardForForm,
    onOpenChange,
  });

  const { bulkText, parsedCards, searchResults, isProcessing, processedCount } = state;

  const processedResults = useMemo(() => {
    return searchResults.map((r) => {
      const cardId =
        r.selectedCard?.importationId || r.selectedCard?.productId || r.selectedCard?.id;
      const isProcessed = r.isProcessed || !!(cardId && addedIds.has(cardId));
      return { ...r, isProcessed };
    });
  }, [searchResults, addedIds]);

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
            <>
              <div>
                <Label htmlFor="bulk-text">Texto de las cartas</Label>
                <Textarea
                  id="bulk-text"
                  value={bulkText}
                  onChange={(e) => dispatch({ type: 'SET_BULK_TEXT', payload: e.target.value })}
                  placeholder="1 Aminatou, Veil Piercer&#10;1 Lightning Bolt (M21) 158 *F*&#10;2 Counterspell (M21) 53"
                  className="min-h-[200px] font-mono"
                />
              </div>

              <Button
                onClick={handleProcessBulk}
                disabled={isProcessing || !bulkText.trim()}
                className="w-full"
              >
                {isProcessing
                  ? `Procesando... (${processedCount}/${parsedCards.length})`
                  : 'Procesar Cartas'}
              </Button>
            </>
          )}

          {!isProcessing &&
            processedResults.length > 0 &&
            (() => {
              // Find the first unprocessed card (including cards with errors or no results)
              const firstUnprocessedIndex = processedResults.findIndex(
                (result: CardSearchResult) => !result.isProcessed
              );

              // If all cards are processed, show a message
              if (firstUnprocessedIndex === -1) {
                const allProcessed = processedResults.every((r: CardSearchResult) => r.isProcessed);
                if (allProcessed) {
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
              }

              // Show only the first unprocessed card
              const result =
                firstUnprocessedIndex >= 0
                  ? processedResults[firstUnprocessedIndex]
                  : processedResults[0];
              const index = firstUnprocessedIndex >= 0 ? firstUnprocessedIndex : 0;

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                      Carta {index + 1} de {processedResults.length}
                    </h3>
                    {(() => {
                      const processedCount = processedResults.filter(
                        (r: CardSearchResult) => r.isProcessed
                      ).length;
                      if (processedCount === 0) return null;
                      return (
                        <span className="text-sm text-muted-foreground">
                          {processedCount} procesada(s)
                        </span>
                      );
                    })()}
                  </div>

                  <Card key={result.parsedCard.cardNumber || result.parsedCard.name}>
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
                            onClick={() => handleSkipCard(index)}
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
                              onClick={() => handleSkipCard(index)}
                              className="text-muted-foreground"
                            >
                              Saltar esta carta
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto">
                            {result.results.map((card: ImportationCard, cardIndex: number) => (
                              <BulkImportCardItem
                                key={cardIndex}
                                card={card}
                                parsedFoil={result.parsedCard.isFoil}
                                parsedCardNumber={result.parsedCard.cardNumber}
                                onSelect={(selectedCard) => handleSelectCard(index, selectedCard)}
                              />
                            ))}
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
                            onClick={() => handleSkipCard(index)}
                            className="w-full text-muted-foreground"
                          >
                            Saltar esta carta y continuar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
