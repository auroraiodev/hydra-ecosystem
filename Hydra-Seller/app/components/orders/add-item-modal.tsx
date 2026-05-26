'use client';

import { useEffect, useReducer, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowSync24Regular, Box24Regular, Add24Regular } from '@fluentui/react-icons';
import { singlesAPI, searchAPI } from '@/lib/api';
import { SafeImg } from '@/components/ui/safe-img';
import { toast } from 'sonner';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (itemData: {
    singleId: string;
    quantity: number;
    isImportation?: boolean;
    cardName?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    productData?: any;
  }) => Promise<void>;
}

interface SearchState {
  query: string;
  suggestions: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: any[];
  loading: boolean;
  selectedCardName: string | null;
}

type SearchAction =
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_SUGGESTIONS'; suggestions: string[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'SET_RESULTS'; results: any[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SELECTED_CARD'; name: string | null }
  | { type: 'SELECT_CARD'; cardName: string }
  | { type: 'CLEAR' };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY': return { ...state, query: action.query, results: [], selectedCardName: null };
    case 'SET_SUGGESTIONS': return { ...state, suggestions: action.suggestions };
    case 'SET_RESULTS': return { ...state, results: action.results };
    case 'SET_LOADING': return { ...state, loading: action.loading };
    case 'SET_SELECTED_CARD': return { ...state, selectedCardName: action.name };
    case 'SELECT_CARD': return { ...state, query: action.cardName, suggestions: [], loading: true, selectedCardName: action.cardName };
    case 'CLEAR': return { query: '', suggestions: [], results: [], loading: false, selectedCardName: null };
  }
}

export function AddItemModal({ isOpen, onClose, onConfirm }: AddItemModalProps) {
  const [searchState, dispatchSearch] = useReducer(searchReducer, { query: '', suggestions: [], results: [], loading: false, selectedCardName: null });
  const { query: searchQuery, suggestions: autocompleteSuggestions, results, loading, selectedCardName } = searchState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Autocomplete with Scryfall
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

    const timer = setTimeout(() => {
      getAutocomplete(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  //  Step 2: Search local + Importation for selected card
  const handleSelectCard = async (cardName: string) => {
    dispatchSearch({ type: 'SELECT_CARD', cardName });

    try {
      const [localResponse, importationResponse] = await Promise.allSettled([
        singlesAPI.list(1, 10, cardName),
        singlesAPI.importationSearch(cardName, 1),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let combinedResults: any[] = [];

      if (localResponse.status === 'fulfilled') {
        const localData = localResponse.value;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let localItems: any[] = [];
        if (localData?.data?.data) localItems = localData.data.data;
        else if (localData?.data && Array.isArray(localData.data)) localItems = localData.data;
        else if (Array.isArray(localData)) localItems = localData;

        localItems = localItems.map((item) => ({
          ...item,
          isLocalInventory: true,
          isImportationImport: false,
        }));
        combinedResults = [...combinedResults, ...localItems];
      }

      if (importationResponse.status === 'fulfilled') {
        const importationData = importationResponse.value;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let importationItems: any[] = [];
        if (importationData?.data?.data) importationItems = importationData.data.data;
        else if (importationData?.data && Array.isArray(importationData.data))
          importationItems = importationData.data;
        else if (Array.isArray(importationData)) importationItems = importationData;

        importationItems = importationItems.map((item) => ({
          ...item,
          isLocalInventory: false,
          isImportationImport: true,
        }));
        combinedResults = [...combinedResults, ...importationItems];
      }

      dispatchSearch({ type: 'SET_RESULTS', results: combinedResults });
    } catch (error) {
      console.error('Search failed', error);
      toast.error('Failed to search products');
    } finally {
      dispatchSearch({ type: 'SET_LOADING', loading: false });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelect = (product: any) => {
    setSelectedProduct(product);
    setQuantity(1);
    dispatchSearch({ type: 'CLEAR' });
  };

  const handleSubmit = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      const isImportation = selectedProduct.isImportationImport;
      const payload = {
        singleId: isImportation
          ? String(selectedProduct.importationId || selectedProduct.productId)
          : selectedProduct.id,
        quantity,
        isImportation,
        cardName: isImportation ? selectedProduct.cardName || selectedProduct.name : undefined,
        productData: isImportation
          ? {
              name: selectedProduct.cardName || selectedProduct.name || selectedProduct.title,
              cardName: selectedProduct.cardName || selectedProduct.name,
              importationId: String(selectedProduct.importationId || selectedProduct.productId),
              price:
                typeof selectedProduct.price === 'string'
                  ? parseFloat(selectedProduct.price.replace(/[^0-9.-]+/g, ''))
                  : selectedProduct.price,
              imageUrl: selectedProduct.img || selectedProduct.imageUrl,
              language: selectedProduct.language,
              foil: selectedProduct.foil,
            }
          : undefined,
      };

      await onConfirm(payload);
      setSelectedProduct(null);
      setQuantity(1);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Item to Order</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Search for products to add (local & import)
          </p>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto min-h-[300px]">
          {!selectedProduct ? (
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Type card name..."
                  value={searchQuery}
                  onChange={(e) => {
                    dispatchSearch({ type: 'SET_QUERY', query: e.target.value });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleSelectCard(searchQuery.trim());
                    }
                  }}
                  className="pr-10"
                />
                {loading && (
                  <ArrowSync24Regular className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Autocomplete Suggestions */}
              {autocompleteSuggestions.length > 0 && !selectedCardName && (
                <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-lg z-10 w-full mt-1">
                  {autocompleteSuggestions.map((suggestion) => (
                    <div
                      key={suggestion}
                      role="button"
                      tabIndex={0}
                      className="p-2 hover:bg-muted cursor-pointer text-sm transition-colors"
                      onClick={() => handleSelectCard(suggestion)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleSelectCard(suggestion);
                        }
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}

              {loading && results.length === 0 ? (
                <div className="flex justify-center p-8 text-muted-foreground text-sm">
                  <ArrowSync24Regular className="size-5 animate-spin mr-2" />
                  Searching…
                </div>
              ) : results.length > 0 ? (
                <div className="border rounded-md max-h-[400px] overflow-y-auto divide-y">
                  {results.map((product, index) => (
                    <div
                      key={product.id || product.importationId || `item-${index}`}
                      role="button"
                      tabIndex={0}
                      className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => handleSelect(product)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleSelect(product);
                        }
                      }}
                    >
                      <div className="h-24 w-18 relative flex-shrink-0 bg-secondary rounded overflow-hidden">
                        <SafeImg
                          src={product.img || product.imageUrl}
                          alt={product.cardName || product.name || 'Product'}
                          className="object-cover size-full"
                          fallback={
                            <div className="size-full flex items-center justify-center">
                              <Box24Regular className="size-8 text-muted-foreground opacity-20" />
                            </div>
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate text-sm">
                            {product.cardName || product.name}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {(product.foil || product.isFoil) && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-yellow-400 text-yellow-950 border-none font-bold">
                                FOIL
                              </Badge>
                            )}
                            {(product.language || product.lang) && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-zinc-100 text-zinc-700 border-zinc-200 uppercase font-bold"
                              >
                                {product.language || product.lang}
                              </Badge>
                            )}
                            {product.isImportationImport ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200"
                              >
                                Import
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
                              >
                                Local
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                          {product.expansion && <span>{product.expansion}</span>}
                          {product.cardNumber && <span>#{product.cardNumber}</span>}
                          {product.variant && product.variant !== product.expansion && (
                            <>
                              <span className="mx-0.5">•</span>
                              <span>{product.variant}</span>
                            </>
                          )}
                          <span className="mx-0.5">•</span>
                          <span>Stock: {product.stock}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">
                          ${Number(product.finalPrice ?? product.price).toFixed(2)}
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 mt-1">
                          <Add24Regular className="size-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedCardName ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No stock found for &quot;{selectedCardName}&quot;
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery.length > 0
                    ? 'Select a card to check stock'
                    : 'Type at least 3 characters to search'}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 border rounded-md bg-secondary/20">
                <div className="h-24 w-16 relative flex-shrink-0 bg-background rounded border overflow-hidden">
                  <SafeImg
                    src={selectedProduct.img || selectedProduct.imageUrl}
                    alt={selectedProduct.cardName || selectedProduct.name}
                    className="object-cover size-full"
                    fallback={
                      <div className="size-full flex items-center justify-center">
                        <Box24Regular className="size-6 text-muted-foreground" />
                      </div>
                    }
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {selectedProduct.cardName || selectedProduct.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    {selectedProduct.expansion || selectedProduct.set_name}
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm mt-1">
                    <Badge variant="outline" className="text-xs">
                      Stock: {selectedProduct.stock}
                    </Badge>
                    {selectedProduct.isImportationImport ? (
                      <Badge
                        variant="outline"
                        className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                      >
                        Import
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                      >
                        Local
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 font-bold text-xs"
                    >
                      ${Number(selectedProduct.finalPrice ?? selectedProduct.price).toFixed(2)} MXN
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)}>
                  Change
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={String(quantity)}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setQuantity(Math.min(selectedProduct.stock || 999, quantity + 1))
                    }
                    disabled={quantity >= (selectedProduct.stock || 999)}
                  >
                    +
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: $
                  {(Number(selectedProduct.finalPrice ?? selectedProduct.price) * quantity).toFixed(
                    2
                  )}{' '}
                  MXN
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {selectedProduct && (
            <Button onClick={handleSubmit} disabled={isSubmitting || quantity < 1}>
              {isSubmitting && <ArrowSync24Regular className="mr-2 size-4 animate-spin" />}
              Add {quantity} to Order
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
