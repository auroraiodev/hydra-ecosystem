'use client';

import { Box24Regular } from '@fluentui/react-icons';
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

const EMPTY_IMPORTATION_RESULTS: ImportationCard[] = [];
const EMPTY_IMPORTATION_FILTERS: ImportationSearchFilters = {} as ImportationSearchFilters;

// Categories that are tied to a specific TCG.

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
}

export function DynamicProductForm({
  selectedCategory,
  selectedOwner,
  conditions: _conditions,
  languages,
  selectedTcg,
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
  onImportationFiltersChange: _onImportationFiltersChange,
}: DynamicProductFormProps) {
  if (!selectedCategory) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm mb-4">
          <Box24Regular className="size-10 text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
          Sin categoría seleccionada
        </h3>
        <p className="text-sm text-zinc-500 max-w-xs">
          Selecciona una supracategoría y categoría en la parte superior para comenzar a agregar
          productos.
        </p>
      </div>
    );
  }

  const categoryName = selectedCategory.name?.toUpperCase() || '';
  const formType = (selectedCategory.form_config as { form_type?: string } | undefined)?.form_type;

  // Prefer data-driven form_type from category config; fall back to name-based for legacy data
  const isSingles =
    formType === 'singles' ||
    (!formType && (categoryName === 'SINGLES' || categoryName === 'CARDS'));

  // Wrap onAddItem to inject tcgId from selectedTcg
  const handleAddItem = (item: AddProductData) => {
    // If a TCG is selected in the dashboard, we should use it.
    // If the category requires a TCG (like Singles, Booster, etc.), we MUST use it.
    const finalTcgId = item.tcgId || (selectedTcg ? selectedTcg.id : undefined);

    onAddItem({
      ...item,
      tcgId: finalTcgId,
    });
  };

  // Route to appropriate form based on category
  if (isSingles) {
    return (
      <SinglesProductForm
        selectedCategory={selectedCategory}
        selectedOwner={selectedOwner!}
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
