'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowSync24Regular } from '@fluentui/react-icons';
import { useAddItemManager } from './hooks/useAddItemManager';
import { SearchSection } from './components/add-item/SearchSection';
import { ProductSelectionDetails } from './components/add-item/ProductSelectionDetails';

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

export function AddItemModal({ isOpen, onClose, onConfirm }: AddItemModalProps) {
  const {
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
  } = useAddItemManager({ onConfirm, onClose });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Item to Order</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Search for products to add (local & import)
          </p>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto min-h-[300px]">
          {!selectedProduct ? (
            <SearchSection
              query={searchState.query}
              isLoading={searchState.isLoading}
              suggestions={searchState.suggestions}
              results={searchState.results}
              selectedCardName={selectedCardName}
              onQueryChange={(query) => {
                dispatchSearch({ type: 'SET_QUERY', query });
                dispatchSearch({ type: 'SET_RESULTS', results: [] });
                setSelectedCardName(null);
              }}
              onSelectCard={handleSelectCard}
              onSelectProduct={handleSelect}
            />
          ) : (
            <ProductSelectionDetails
              selectedProduct={selectedProduct}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onDeselect={() => setSelectedProduct(null)}
            />
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
