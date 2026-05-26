'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Add24Regular, Box24Regular } from '@fluentui/react-icons';
import { SinglesSearchCard } from './components/singles-form-parts/SinglesSearchCard';
import { SinglesBasicInfo } from './components/SinglesBasicInfo';
import { SinglesImages } from './components/SinglesImages';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormItem, FormLabel } from '@/components/ui/form-field';
import { CameraScanner } from './CameraScanner';
import type {
  ImportationCard,
  ImportationSearchFilters,
  SinglesProductFormProps,
} from './types';

import { useSinglesProductManager } from './hooks/useSinglesProductManager';
import { registerCardSelectHandler } from './card-select-registry';

const EMPTY_ARRAY: ImportationCard[] = [];
const DEFAULT_FILTERS = {} as ImportationSearchFilters;

export function SinglesProductForm({
  selectedCategory,
  selectedOwner,
  validationErrors,
  onAddItem,
  onSelectCategory,
  onSearchImportation,
  importationResults = EMPTY_ARRAY,
  isSearchingImportation = false,
  onSelectImportationCard,
  onCardAdded,
  isSubmitting = false,
  importationFilters = DEFAULT_FILTERS,
  selectedTcg,
}: SinglesProductFormProps) {
  const {
    state,
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
  } = useSinglesProductManager({
    selectedCategory,
    selectedOwner,
    onAddItem,
    onSearchImportation,
    onSelectImportationCard,
    onCardAdded,
    importationFilters,
    importationResults,
    selectedTcg,
  });

  const {
    formData,
    searchQuery,
    showDropdown,
    showImportationResults,
    selectedIndex,
    showCamera,
    newTagInput
  } = state;

  const {
    conditions,
    languages,
    isLoadingConditions,
    isLoadingLanguages,
    availableTags,
    defaultTags,
  } = metadata;

  // Register handler for bulk import
  useEffect(() => {
    return registerCardSelectHandler(handleImportationCardSelect);
  }, [handleImportationCardSelect]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Agregar Nueva Carta</h3>
          <Button onClick={handleAddItem} disabled={isSubmitting || !isFormValid()} variant="outline">
            <Add24Regular className="size-4 mr-2" />
            Agregar Carta
          </Button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg flex justify-between items-center">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Categoría:</strong> {selectedCategory.displayName || selectedCategory.name}
          </p>
          <button onClick={() => onSelectCategory(null)} className="text-xs text-blue-600 dark:text-blue-400 underline">Cambiar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SinglesSearchCard
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              suggestions={suggestions}
              selectedIndex={selectedIndex}
              onSuggestionSelect={handleSuggestionSelect}
              importationResults={importationResults}
              onImportationCardSelect={handleImportationCardSelect}
              importationFilters={importationFilters}
              uiState={{
                isSearching,
                showDropdown,
                showImportationResults,
                isSearchingImportation,
                showCamera,
                setShowCamera: (v) => setField('showCamera', v),
              }}
              isSubmitting={isSubmitting}
            />

            <SinglesBasicInfo
              formData={formData} setFormData={setFormData} validationErrors={validationErrors} isSubmitting={isSubmitting}
              conditions={conditions} isLoadingConditions={isLoadingConditions} languages={languages} isLoadingLanguages={isLoadingLanguages}
              availableTags={availableTags} defaultTags={defaultTags} newTagInput={newTagInput} setNewTagInput={(v) => setField('newTagInput', v)}
              formConfig={selectedCategory?.form_config as { fields: Record<string, { enabled: boolean; label?: string }> } | undefined}
            />

            <SinglesImages formData={formData} setFormData={setFormData} isSubmitting={isSubmitting} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {showCamera && (
                <CameraScanner
                  onTextDetected={(text) => {
                    const cleanText = text.split(/[\n\r]/)[0].trim();
                    if (cleanText) { handleSuggestionSelect(cleanText); toast.success('Texto detectado'); }
                  }}
                  className="w-full shadow-lg border-2 border-primary/20"
                />
              )}
              <FormItem>
                <FormLabel>Vista Previa</FormLabel>
                <div className="border border-border rounded-lg bg-muted/50 p-4 flex items-center justify-center min-h-[400px]">
                  {formData.img ? (
                    <Image src={formData.img} alt="Preview" width={300} height={500} className="max-w-full max-h-[500px] object-contain rounded-lg shadow-md" unoptimized />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Box24Regular className="size-16 mb-4 opacity-50" />
                      <p className="text-sm">Vista previa de imagen</p>
                    </div>
                  )}
                </div>
              </FormItem>
              <div className="flex justify-center mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs" 
                  onClick={() => setField('showCamera', !showCamera)}
                >
                  {showCamera ? 'Ocultar Cámara' : 'Usar Cámara'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
