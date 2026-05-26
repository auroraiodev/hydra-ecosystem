'use client';

import type {
  AddProductData,
  Category,
  Condition,
  Language,
  User,
  ImportationCard,
  Tcg,
  ImportationSearchFilters,
} from './types';
import { SinglesProductForm } from './SinglesProductForm';
import { GenericProductForm } from './GenericProductForm';
import { Button } from '@/components/ui/button';
import { ArrowCounterclockwise24Regular } from '@fluentui/react-icons';

interface DynamicProductFormProps {
  selectedCategory: Category | null;
  selectedOwner: User | null;
  items: AddProductData[];
  categories: Category[];
  conditions: Condition[];
  languages: Language[];
  tcgs: Tcg[];
  selectedTcg: Tcg | null;
  onSelectTcg: (tcg: Tcg | null) => void;
  validationErrors: Record<string, string>;
  onAddItem: (item: AddProductData) => void;
  onSelectCategory: (category: Category | null) => void;
  onSearchImportation?: (query: string, filters?: ImportationSearchFilters) => void;
  importationResults?: ImportationCard[];
  isSearchingImportation?: boolean;
  onSelectImportationCard?: (card: ImportationCard) => void;
  onCardAdded?: (importationId: string | null) => void;
  isSubmitting?: boolean;
  importationFilters?: ImportationSearchFilters;
  onImportationFiltersChange?: (filters: ImportationSearchFilters) => void;
}

const EMPTY_IMPORTATION_RESULTS: ImportationCard[] = [];
const EMPTY_IMPORTATION_FILTERS: ImportationSearchFilters = {};

export function DynamicProductForm({
  selectedCategory,
  selectedOwner,
  conditions,
  languages,
  selectedTcg,
  onSelectTcg,
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
}: DynamicProductFormProps) {
  // If no TCG is selected, show a friendly message
  if (!selectedTcg) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/30">
        <div className="size-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-xl">👆</span>
        </div>
        <h3 className="text-lg font-semibold text-zinc-800">Selecciona una Supracategoría</h3>
        <p className="text-sm text-zinc-500 text-center max-w-xs mt-1">
          Elige un sistema de juego o tipo de product arriba para comenzar.
        </p>
      </div>
    );
  }

  // If no Category is selected, show a friendly message
  if (!selectedCategory) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/30">
        <div className="size-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-xl">📂</span>
        </div>
        <h3 className="text-lg font-semibold text-zinc-800">Selecciona una Categoría</h3>
        <p className="text-sm text-zinc-500 text-center max-w-xs mt-1">
          Ahora elige el tipo de artículo dentro de <strong>{selectedTcg.display_name}</strong>.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectTcg(null)}
          className="mt-4 text-zinc-400 hover:text-primary"
        >
          <ArrowCounterclockwise24Regular className="size-3 mr-2" />
          Cambiar Supracategoría
        </Button>
      </div>
    );
  }

  const categoryName = selectedCategory.name?.toUpperCase() || '';
  const isSingles = categoryName === 'SINGLES' || categoryName === 'CARDS';

  // Wrap onAddItem to inject tcgId from selectedTcg
  const handleAddItem = (item: AddProductData) => {
    onAddItem({
      ...item,
      tcgId: selectedTcg ? selectedTcg.id : undefined,
    });
  };

  // Route to appropriate form based on category
  if (isSingles) {
    return (
      <SinglesProductForm
        selectedCategory={selectedCategory}
        selectedOwner={selectedOwner!}
        conditions={conditions}
        languages={languages}
        validationErrors={validationErrors}
        onAddItem={handleAddItem}
        onSelectCategory={onSelectCategory}
        onSearchImportation={onSearchImportation}
        importationResults={importationResults}
        isSearchingImportation={isSearchingImportation}
        onSelectImportationCard={onSelectImportationCard}
        onCardAdded={onCardAdded}
        isSubmitting={isSubmitting}
        importationFilters={importationFilters}
        onImportationFiltersChange={onImportationFiltersChange}
        selectedTcg={selectedTcg}
      />
    );
  }

  // Generic form for other categories
  return (
    <GenericProductForm
      selectedCategory={selectedCategory}
      selectedOwner={selectedOwner!}
      validationErrors={validationErrors}
      onAddItem={handleAddItem}
      onSelectCategory={onSelectCategory}
      languages={languages}
      selectedTcg={selectedTcg}
    />
  );
}
