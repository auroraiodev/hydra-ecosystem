'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import {
  useAddProduct,
  OwnerSelector,
  TcgSelector,
  CategorySelector,
  DynamicProductForm,
  ItemsList,
  BulkImportDialog,
} from '@/lib/features/add-product';
function AddProductContent() {
  const { push } = useRouter();
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [lastAddedCardId, setLastAddedCardId] = useState<string | null>(null);
  const {
    selectedOwner,
    selectedCategory,
    selectedTcg,
    items,
    categories,
    tcgs,
    conditions,
    languages,
    importationSearchResults,
    isSearchingImportation,
    validationErrors,
    owners,
    addItem,
    addItems,
    addPendingItem,
    updateItem,
    removeItem,
    clearAllItems,
    setSelectedOwner,
    setSelectedCategory,
    setSelectedTcg,
    searchImportation,
    setImportationFilters,
    importationFilters,
    selectImportationCard,
    loading,
    error,
    isSubmitting,
    loadOwners,
    loadTcgs,
    loadConditions,
    loadLanguages,
  } = useAddProduct();

  useEffect(() => {
    void loadOwners();
    void loadTcgs();
    void loadConditions();
    void loadLanguages();
  }, [loadOwners, loadTcgs, loadConditions, loadLanguages]);

  if (loading && owners.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">Error</p>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => push('/dashboard/products')} variant="outline">
                  Volver
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Agregar Productos al Inventario"
        description="Selecciona cartas y artículos para agregar al inventario"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkImportOpen(true)}
              className="flex items-center gap-2"
            >
              Importación Masiva
            </Button>
            <Button
              variant="outline"
              onClick={() => push('/dashboard/products')}
              className="flex items-center gap-2"
            >
              <ArrowLeft24Regular />
              Volver al Inventario
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-none border-zinc-200 bg-zinc-50/50">
            <CardContent className="p-2 space-y-2">
              <OwnerSelector
                selectedOwner={selectedOwner}
                owners={owners}
                onSelect={setSelectedOwner}
                loading={loading}
              />
              <TcgSelector
                tcgs={tcgs}
                selectedTcg={selectedTcg}
                onSelectTcg={setSelectedTcg}
                disabled={!selectedOwner}
              />
              {selectedTcg && (
                <CategorySelector
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              )}
            </CardContent>
          </Card>

          <DynamicProductForm
            selectedCategory={selectedCategory}
            selectedOwner={selectedOwner}
            items={items}
            categories={categories}
            tcgs={tcgs}
            selectedTcg={selectedTcg}
            onSelectTcg={setSelectedTcg}
            conditions={conditions}
            languages={languages}
            validationErrors={validationErrors}
            onAddItem={addItem}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
            }}
            onSearchImportation={(query, filters) => {
              void searchImportation(query, filters);
            }}
            importationResults={importationSearchResults}
            isSearchingImportation={isSearchingImportation}
            onSelectImportationCard={selectImportationCard}
            importationFilters={importationFilters}
            onImportationFiltersChange={setImportationFilters}
            onCardAdded={(importationId) => {
              setLastAddedCardId(importationId);
            }}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="lg:col-span-1">
          <ItemsList
            items={items}
            onRemoveItem={removeItem}
            onUpdateItem={updateItem}
            onClearAll={clearAllItems}
            selectedOwner={selectedOwner}
            selectedCategory={selectedCategory}
            loading={loading}
          />
        </div>
      </div>

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={(_, data) => setBulkImportOpen(data.open)}
        selectedCategory={selectedCategory}
        selectedOwner={selectedOwner}
        conditions={conditions}
        languages={languages}
        onAddItems={addItems}
        onAddPendingItem={addPendingItem}
        onSelectCardForForm={selectImportationCard}
        currentImportationId={lastAddedCardId}
        onCardAdded={() => {
          setLastAddedCardId(null);
        }}
      />
    </PageLayout>
  );
}

export default function AddProductPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      }
    >
      <AddProductContent />
    </Suspense>
  );
}
