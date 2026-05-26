'use client';

import { useState, useReducer, useEffect } from 'react';
import {
  ArrowUpload24Regular,
  Edit24Regular,
  Delete24Regular,
  Box24Regular,
  Tag24Regular,
} from '@fluentui/react-icons';
import Image from 'next/image';
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
import { toast } from 'sonner';
import { singlesAPI, tagsAPI } from '@/lib/api';
import { BulkTagsPanel } from './components/BulkTagsPanel';
import type { ItemsListProps } from './types';

export function ItemsList({
  items,
  onRemoveItem,
  onUpdateItem,
  onClearAll,
  selectedOwner,
  selectedCategory,
  loading,
}: ItemsListProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk tags state
  const [bulkTags, setBulkTags] = useState<string[]>([]);
  const [newBulkTagInput, setNewBulkTagInput] = useState('');
  const [, _setAvailableTags] = useState<
    Array<{ id: string; name: string; display_name?: string }>
  >([]);

  type TagsLoadState = { defaultTags: string[]; isLoadingTags: boolean };
  const [tagsLoadState, dispatchTagsLoadState] = useReducer(
    (s: TagsLoadState, a: Partial<TagsLoadState>): TagsLoadState => ({ ...s, ...a }),
    { defaultTags: [], isLoadingTags: false }
  );
  const { defaultTags, isLoadingTags } = tagsLoadState;

  // Load tags from API on mount
  useEffect(() => {
    const loadTags = async () => {
      dispatchTagsLoadState({ isLoadingTags: true });
      let resolvedDefaultTags: string[] = [];
      try {
        // Try to get default tags, but don't fail if endpoint doesn't exist
        try {
          const defaultResponse = await tagsAPI.getDefault();
          let defaultTagsArray: Array<{ name?: string; display_name?: string }> = [];

          if (Array.isArray(defaultResponse)) {
            defaultTagsArray = defaultResponse;
          } else if (defaultResponse?.data && Array.isArray(defaultResponse.data)) {
            defaultTagsArray = defaultResponse.data;
          } else if (
            defaultResponse?.success &&
            defaultResponse.data &&
            Array.isArray(defaultResponse.data)
          ) {
            defaultTagsArray = defaultResponse.data;
          }

          resolvedDefaultTags = defaultTagsArray.map((t) => t.name || t.display_name || String(t));
        } catch {
          // fallback used below
        }

        // If no default tags from API, use fallback
        if (resolvedDefaultTags.length === 0) {
          resolvedDefaultTags = ['Commander', 'Personal', 'Reestock', 'cEDH Staple'];
        }

        // Try to get all active tags, but don't fail if endpoint doesn't exist
        try {
          const activeResponse = await tagsAPI.getActive();
          let activeTagsArray: Array<{ id: string; name: string; display_name?: string }> = [];

          if (Array.isArray(activeResponse)) {
            activeTagsArray = activeResponse;
          } else if (activeResponse?.data && Array.isArray(activeResponse.data)) {
            activeTagsArray = activeResponse.data;
          } else if (
            activeResponse?.success &&
            activeResponse.data &&
            Array.isArray(activeResponse.data)
          ) {
            activeTagsArray = activeResponse.data;
          }

          _setAvailableTags(
            activeTagsArray.map((t) => ({
              id: t.id,
              name: t.name,
              display_name: t.display_name || t.name,
            }))
          );
        } catch {
          // availableTags stays empty — user can still add custom tags
        }
      } catch {
        // fallback to hardcoded defaults
        resolvedDefaultTags = ['Commander', 'Personal', 'Reestock', 'cEDH Staple'];
      } finally {
        dispatchTagsLoadState({ defaultTags: resolvedDefaultTags, isLoadingTags: false });
      }
    };

    void loadTags();
  }, []); // Only run on mount

  // Early returns must come AFTER all hooks
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {['sk-0', 'sk-1', 'sk-2'].map((skId) => (
              <div key={skId} className="p-4 border rounded-lg">
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
            <div className="size-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Box24Regular className="size-8 text-neutral-400" />
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

  const handleApplyBulkTags = () => {
    if (bulkTags.length === 0) {
      toast.info('Selecciona al menos una etiqueta para aplicar');
      return;
    }

    // Apply tags to all items (non-pending items only)
    const itemsToUpdate = items.filter((item) => item._isPending !== true);

    if (itemsToUpdate.length === 0) {
      toast.info('No hay productos disponibles para aplicar etiquetas');
      return;
    }

    // Update each non-pending item with the bulk tags (merge with existing tags)
    let updatedCount = 0;
    items.forEach((item, index) => {
      if (item._isPending === true) return; // Skip pending items

      const currentTags = item.tags || [];
      // Merge tags, avoiding duplicates
      const mergedTags = [...new Set([...currentTags, ...bulkTags])];

      onUpdateItem(index, { tags: mergedTags });
      updatedCount++;
    });

    toast.success(`Se aplicaron ${bulkTags.length} etiqueta(s) a ${updatedCount} producto(s)`);
  };

  const totalValue = items.reduce((sum, item) => sum + (item.price || 0) * (item.inStock || 1), 0);
  // averagePrice is unused per lint rules

  const handleSubmitToInventory = async () => {
    if (!selectedOwner) {
      toast.error(
        'Error: No se ha seleccionado un propietario. Por favor, selecciona un propietario primero.'
      );
      return;
    }

    if (!selectedCategory) {
      toast.error(
        'Error: No se ha seleccionado una categoría. Por favor, selecciona una categoría primero.'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const validationErrors: string[] = [];
      items.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
          validationErrors.push(`Producto ${index + 1}: El nombre es requerido`);
        }
        if (!item.categoryId && !selectedCategory) {
          validationErrors.push(`Producto ${index + 1} (${item.name}): La categoría es requerida`);
        }
        if (!item.imageUrl || item.imageUrl.trim() === '') {
          validationErrors.push(
            `Producto ${index + 1} (${item.name}): La URL de imagen es requerida`
          );
        }
        if (item.price === undefined || item.price === null || Number(item.price) < 0) {
          validationErrors.push(
            `Producto ${index + 1} (${item.name}): El precio debe ser mayor o igual a 0`
          );
        }
      });

      if (validationErrors.length > 0) {
        toast.error(
          `Error de validación: ${validationErrors[0]}${
            validationErrors.length > 1 ? ` (+${validationErrors.length - 1} más)` : ''
          }`
        );
        setIsSubmitting(false);
        return;
      }

      // isValidUUID is unused per lint rules

      // Map all items to CreateSingleDto format (including pending items that were accepted)
      // Filter out items that are still pending (not yet accepted)
      const itemsToProcess = items.filter((item) => item._isPending !== true);

      if (itemsToProcess.length === 0) {
        toast.error(
          'No hay productos para agregar. Por favor acepta las cartas pendientes primero.'
        );
        setIsSubmitting(false);
        return;
      }

      const productsToCreate = itemsToProcess.map((item) => {
        // Get condition and language IDs - they should be UUIDs
        const conditionId = item.conditionId || null;
        const languageId = item.languageId || null;
        const categoryId = item.categoryId || selectedCategory?.id || '';

        return {
          borderless: item.isBorderless || false,
          cardName: (item.name || '').trim(),
          cardNumber: item.cardNumber || '',
          category_id: categoryId,
          condition_id: conditionId,
          expansion: item.expansion || '',
          extendedArt: item.extendedArt || false,
          finalPrice: Number(item.price) || 0,
          foil: item.isFoil || false,
          importationId: item.importationId || item.importationProductId || '',
          img:
            item.imageUrl?.trim() ||
            (Array.isArray(item.imageUrls) && item.imageUrls.length > 0 ? item.imageUrls[0] : '') ||
            '/placeholder-product.png',
          isLocalInventory: true,
          language_id: languageId,
          link: item.importationLink || '',
          metadata: [],
          images: item.imageUrls || [],
          owner_id: selectedOwner.id,
          prerelease: item.prerelease || false,
          premierPlay: item.premierPlay || false,
          stock: item.inStock !== undefined && item.inStock !== null ? Number(item.inStock) : 1,
          surgeFoil: item.surgeFoil || false,
          tags: item.tags || [],
          variant: item.variant || item.expansion || null,
        };
      });

      console.log('📦 Creating bulk products:', {
        count: productsToCreate.length,
        products: productsToCreate.map((p) => ({
          name: p.cardName,
          category_id: p.category_id,
          condition_id: p.condition_id,
          language_id: p.language_id,
        })),
      });

      // Use bulk endpoint if possible (only if all items are singles with condition/language)
      // If any item is a bundle (missing condition/language), we must use individual createBundle endpoint
      // or separate them. For simplicity, if mixed, we process individually or split batches (but simplistic first)
      const allAreFullSingles = productsToCreate.every((p) => p.condition_id && p.language_id);

      let bulkResult;

      if (allAreFullSingles) {
        try {
          bulkResult = await singlesAPI.createBulk(productsToCreate);
        } catch (error) {
          console.warn('Bulk creation failed, falling back to individual creates', error);
        }
      }

      if (bulkResult && bulkResult.success) {
        const createdCount = bulkResult.createdCount || bulkResult.created?.length || 0;
        const failedCount = bulkResult.failedCount || bulkResult.failed?.length || 0;

        if (failedCount > 0) {
          toast.warning(
            `Se crearon ${createdCount} producto(s) correctamente. ${failedCount} producto(s) fallaron.`
          );
          console.error('Failed products:', bulkResult.failed);
        } else {
          toast.success(`¡Éxito! Se agregaron ${createdCount} producto(s) al inventario.`);
        }
      } else {
        // Fallback to individual creates (or primary way if not all singles)
        if (!allAreFullSingles) {
          console.log(
            '📦 Detected bundle items (missing condition/language), processing individually...'
          );
        }

        const results = await Promise.all(
          productsToCreate.map(async (product, i) => {
            try {
              let createResult;
              if (product.condition_id && product.language_id) {
                createResult = await singlesAPI.create(product);
              } else {
                // For bundles, we MUST include the formatted 'price' string field
                // as CreateBundleDto requires it, unlike CreateSingleDto
                const originalItem = itemsToProcess[i];
                const bundleData = {
                  ...product,
                  price: `$${Number(originalItem.price).toFixed(2)} MXN`,
                };
                createResult = await singlesAPI.createBundle(bundleData);
              }
              return { action: 'created', product: createResult };
            } catch (createError: unknown) {
              const error = createError as Record<string, unknown>;
              console.error(`Error creating product ${product.cardName}:`, createError);
              return {
                action: 'failed',
                product,
                error: (error.message as string) || (error.error as string) || 'Unknown error',
              };
            }
          })
        );

        const createdCount = results.filter((r) => r.action === 'created').length;
        const failedCount = results.filter((r) => r.action === 'failed').length;

        if (failedCount > 0) {
          toast.warning(
            `Se crearon ${createdCount} producto(s) correctamente. ${failedCount} producto(s) fallaron.`
          );
        } else {
          toast.success(`¡Éxito! Se agregaron ${createdCount} producto(s) al inventario.`);
        }
      }

      if (onClearAll) {
        onClearAll();
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al conectar con el servidor. Inténtalo de nuevo.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Progress Modal */}
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
              <Spinner size="medium" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              No cierres esta ventana mientras se procesan las cartas
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-6">
          {items.length > 0 && (
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
                    <Spinner size="small" />
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

          <div className="mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Lista de Productos ({items.length})</h3>
            </div>

            <BulkTagsPanel
              defaultTags={defaultTags}
              isLoadingTags={isLoadingTags}
              bulkTags={bulkTags}
              newBulkTagInput={newBulkTagInput}
              onNewBulkTagInputChange={setNewBulkTagInput}
              onToggleBulkTag={(tag) => {
                setBulkTags((prev) =>
                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                );
              }}
              onAddCustomBulkTag={() => {
                if (newBulkTagInput.trim() && !bulkTags.includes(newBulkTagInput.trim())) {
                  setBulkTags((prev) => [...prev, newBulkTagInput.trim()]);
                  setNewBulkTagInput('');
                }
              }}
              onRemoveBulkTag={(tag) => setBulkTags((prev) => prev.filter((t) => t !== tag))}
              onApplyBulkTags={handleApplyBulkTags}
            />
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const isPending = item._isPending === true;
              return (
                <div
                  key={item._bulkImportId || index}
                  className={`p-4 border rounded-lg transition-colors dark:border-neutral-700 ${
                    isPending
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {isPending && (
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-xs font-semibold bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                        PENDIENTE DE REVISIÓN
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="size-20 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative border border-neutral-300 dark:border-neutral-600">
                      {item.imageUrl && item.imageUrl.trim() !== '' ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-contain p-1"
                          unoptimized
                        />
                      ) : (
                        <Box24Regular className="size-8 text-neutral-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div>
                        <h4 className="font-semibold text-base truncate">{item.name}</h4>
                        {item.title && item.title !== item.name && (
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {item.title}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-3">
                        <span className="text-base font-bold text-green-600 dark:text-green-400">
                          ${item.price?.toFixed(2) || '0.00'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Stock: <span className="font-medium">{item.inStock || 1}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateItem(index, { isFoil: !item.isFoil });
                          }}
                          className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                            item.isFoil
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600'
                          }`}
                          title={item.isFoil ? 'Quitar Foil' : 'Marcar como Foil'}
                        >
                          {item.isFoil ? 'Foil ✓' : 'Normal'}
                        </button>
                        {item.isBorderless && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-medium">
                            Borderless
                          </span>
                        )}
                        {item.extendedArt && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded font-medium">
                            Extended Art
                          </span>
                        )}
                      </div>
                      {/* Tags display */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md"
                            >
                              <Tag24Regular className="size-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isPending ? (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              // Accept: remove pending flag and _bulkImportId
                              onUpdateItem(index, {
                                _isPending: false,
                                _bulkImportId: undefined,
                              });
                              toast.success('Carta aceptada y lista para agregar al inventario');
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            title="Aceptar"
                          >
                            ✓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveItem(index)}
                            className="p-2 size-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Rechazar"
                          >
                            <Delete24Regular className="size-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdateItem(index, item)}
                            className="p-2 size-8"
                            title="Editar"
                          >
                            <Edit24Regular className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveItem(index)}
                            className="p-2 size-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Eliminar"
                          >
                            <Delete24Regular className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {items.length > 0 && (
            <div className="mt-6 pt-4 border-t dark:border-neutral-700">
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
                    <Spinner size="small" />
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
