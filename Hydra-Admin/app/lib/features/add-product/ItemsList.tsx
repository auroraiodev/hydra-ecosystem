'use client';

import {
  ArrowUpload24Regular,
  Box24Regular,
} from '@fluentui/react-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ItemsListProps } from './types';

import { useItemsListManager } from './hooks/useItemsListManager';
import { BulkTagsSection } from './components/items-list/BulkTagsSection';
import { ProductItemCard } from './components/items-list/ProductItemCard';

export function ItemsList({
  items,
  onRemoveItem,
  onUpdateItem,
  onClearAll,
  selectedOwner,
  selectedCategory,
  selectedTcg,
  loading,
}: ItemsListProps) {
  const {
    state,
    dispatch,
    handleApplyBulkTags,
    handleSubmitToInventory,
  } = useItemsListManager({
    items,
    onUpdateItem,
    onClearAll: onClearAll || (() => {}),
    selectedOwner: selectedOwner!,
    selectedCategory: selectedCategory!,
    selectedTcg,
  });

  const { isSubmitting, bulkTags, newBulkTagInput, defaultTags, isLoadingTags } = state;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {['sk1', 'sk2', 'sk3'].map((k) => (
              <div key={k} className="p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  <Skeleton className="size-20 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-3">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="size-8 rounded" />
                    <Skeleton className="size-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Lista de Productos</h3>
          <div className="text-center py-8">
            <div className="size-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Box24Regular className="size-8 text-zinc-400" />
            </div>
            <p className="text-muted-foreground mb-2">No hay productos agregados</p>
            <p className="text-sm text-muted-foreground">
              Los productos que agregues aparecerán aquí
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalValue = items.reduce((sum, item) => sum + (item.price || 0) * (item.inStock || 1), 0);

  return (
    <>
      <Dialog open={isSubmitting} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Procesando Cartas</DialogTitle>
            <DialogDescription>
              Por favor espera mientras se agregan las cartas al inventario…
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center py-4">
              <Spinner size="md" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              No cierres esta ventana mientras se procesan las cartas
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            {items.some((item) => item._isPending === true) && (
              <div className="mb-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Tienes {items.filter((item) => item._isPending === true).length} carta(s)
                  pendiente(s) de revisión. Acepta o rechaza cada una antes de agregar al
                  inventario.
                </p>
              </div>
            )}
            <Button
              onClick={() => void handleSubmitToInventory()}
              className="w-full"
              size="lg"
              disabled={isSubmitting || items.some((item) => item._isPending === true)}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Procesando…</span>
                </>
              ) : (
                <>
                  <ArrowUpload24Regular className="size-4 mr-2" />
                  Agregar {items.filter((item) => item._isPending !== true).length} Producto
                  {items.filter((item) => item._isPending !== true).length !== 1 ? 's' : ''} al
                  Inventario
                </>
              )}
            </Button>
          </div>

          <div className="mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Lista de Productos ({items.length})</h3>
            </div>

            <BulkTagsSection
              bulkTags={bulkTags}
              newBulkTagInput={newBulkTagInput}
              defaultTags={defaultTags}
              isLoadingTags={isLoadingTags}
              onBulkTagsChange={(tags) => dispatch({ type: 'SET_BULK_TAGS', payload: tags })}
              onNewTagInputChange={(val) => dispatch({ type: 'SET_NEW_BULK_TAG_INPUT', payload: val })}
              onAddTag={(tag) => dispatch({ type: 'BULK_TAGS_ADD', payload: tag })}
              onRemoveTag={(tag) => dispatch({ type: 'BULK_TAGS_REMOVE', payload: tag })}
              onApply={handleApplyBulkTags}
            />
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <ProductItemCard
                key={item._bulkImportId || index}
                item={item}
                index={index}
                onRemove={onRemoveItem}
                onUpdate={onUpdateItem}
              />
            ))}
          </div>

          {items.length > 0 && (
            <div className="mt-6 pt-4 border-t dark:border-zinc-700">
              <div className="flex justify-between items-center gap-2">
                <span className="font-medium truncate">Total de productos: {items.length}</span>
                <span className="font-semibold text-lg text-green-600 dark:text-green-400 whitespace-nowrap shrink-0">
                  ${totalValue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-6">
              <Button
                onClick={() => void handleSubmitToInventory()}
                className="w-full"
                size="lg"
                variant="outline"
                disabled={isSubmitting || items.some((item) => item._isPending === true)}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-2">Procesando…</span>
                  </>
                ) : (
                  <>
                    <ArrowUpload24Regular className="size-4 mr-2" />
                    Agregar {items.filter((item) => item._isPending !== true).length} Producto
                    {items.filter((item) => item._isPending !== true).length !== 1 ? 's' : ''} al
                    Inventario
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
