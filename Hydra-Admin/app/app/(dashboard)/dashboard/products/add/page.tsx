'use client';

import { useEffect, Suspense, useState, useMemo } from 'react';
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
  DynamicProductForm,
  ItemsList,
  BulkImportDialog,
  TcgSelector,
  CategorySelector,
} from '@/lib/features/add-product';

function AddProductContent() {
  const { push } = useRouter();
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
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
    loadSettings,
    importationSettings,
  } = useAddProduct();

  const addedIds = useMemo(() => {
    return items.reduce<Set<string>>((acc, item) => {
      if (item.importationId) acc.add(item.importationId);
      return acc;
    }, new Set());
  }, [items]);

  useEffect(() => {
    void loadOwners();
    void loadTcgs();
    void loadConditions();
    void loadLanguages();
    void loadSettings();
  }, [loadOwners, loadTcgs, loadConditions, loadLanguages, loadSettings]);

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
              <ArrowLeft24Regular className="size-4" />
              Volver al Inventario
            </Button>
          </div>
        }
      />

      {/* Ultra-compact Dashboard Header */}
      <Card className="mb-6 border-none shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <OwnerSelector
              selectedOwner={selectedOwner}
              owners={owners}
              onSelect={setSelectedOwner}
              loading={loading}
            />
          </div>

          <div className="space-y-3">
            <TcgSelector
              tcgs={tcgs}
              selectedTcg={selectedTcg}
              onSelectTcg={setSelectedTcg}
              disabled={loading}
            />

            {selectedTcg && (
              <CategorySelector
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
            onSelectCategory={setSelectedCategory}
            onSearchImportation={(query, filters) => {
              void searchImportation(query, filters);
            }}
            importationResults={importationSearchResults}
            isSearchingImportation={isSearchingImportation}
            onSelectImportationCard={selectImportationCard}
            importationFilters={importationFilters}
            onImportationFiltersChange={setImportationFilters}
            onCardAdded={() => {
              // no-op
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
            selectedTcg={selectedTcg}
            loading={loading}
          />
        </div>
      </div>

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        addedIds={addedIds}
        selectedCategory={selectedCategory}
        selectedOwner={selectedOwner}
        conditions={conditions}
        languages={languages}
        onAddItems={addItems}
        onAddPendingItem={addPendingItem}
        onSelectCardForForm={selectImportationCard}
        onCardAdded={() => {
          // no-op
        }}
        tax={importationSettings.tax}
        profit={importationSettings.profit}
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
          <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid lg:grid-cols-3 gap-6">
              <Skeleton className="lg:col-span-2 h-96 w-full" />
              <Skeleton className="lg:col-span-1 h-96 w-full" />
            </div>
          </div>
        </div>
      }
    >
      <AddProductContent />
    </Suspense>
  );
}
