'use client';

import { useReducer, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { tagsAPI, singlesAPI } from '@/lib/api';
import type { AddProductData, Category, User, Tcg } from '../types';

type ItemsListAction =
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_BULK_TAGS'; payload: string[] }
  | { type: 'BULK_TAGS_ADD'; payload: string }
  | { type: 'BULK_TAGS_REMOVE'; payload: string }
  | { type: 'SET_NEW_BULK_TAG_INPUT'; payload: string }
  | { type: 'SET_DEFAULT_TAGS'; payload: string[] }
  | { type: 'SET_LOADING_TAGS'; payload: boolean };

interface ItemsListState {
  isSubmitting: boolean;
  bulkTags: string[];
  newBulkTagInput: string;
  defaultTags: string[];
  isLoadingTags: boolean;
}

const initialItemsListState: ItemsListState = {
  isSubmitting: false,
  bulkTags: [],
  newBulkTagInput: '',
  defaultTags: [],
  isLoadingTags: false,
};

function itemsListReducer(state: ItemsListState, action: ItemsListAction): ItemsListState {
  switch (action.type) {
    case 'SET_SUBMITTING': return { ...state, isSubmitting: action.payload };
    case 'SET_BULK_TAGS': return { ...state, bulkTags: action.payload };
    case 'BULK_TAGS_ADD': return { ...state, bulkTags: [...state.bulkTags, action.payload] };
    case 'BULK_TAGS_REMOVE': return { ...state, bulkTags: state.bulkTags.filter((t) => t !== action.payload) };
    case 'SET_NEW_BULK_TAG_INPUT': return { ...state, newBulkTagInput: action.payload };
    case 'SET_DEFAULT_TAGS': return { ...state, defaultTags: action.payload };
    case 'SET_LOADING_TAGS': return { ...state, isLoadingTags: action.payload };
    default: return state;
  }
}

export function useItemsListManager({
  items,
  onUpdateItem,
  onClearAll,
  selectedOwner,
  selectedCategory,
  selectedTcg,
}: {
  items: AddProductData[];
  onUpdateItem: (index: number, item: Partial<AddProductData>) => void;
  onClearAll: () => void;
  selectedOwner: User | null | undefined;
  selectedCategory: Category | null | undefined;
  selectedTcg: Tcg | null | undefined;
}) {
  const _availableTagsRef = useRef<Array<{ id: string; name: string; display_name?: string }>>([]);
  const [state, dispatch] = useReducer(itemsListReducer, initialItemsListState);

  useEffect(() => {
    const loadTags = async () => {
      dispatch({ type: 'SET_LOADING_TAGS', payload: true });
      try {
        let defaultTagNames: string[] = [];
        try {
          const defaultResponse = await tagsAPI.getDefault();
          let defaultTagsArray: Array<{ name?: string; display_name?: string }> = [];
          if (Array.isArray(defaultResponse)) defaultTagsArray = defaultResponse;
          else if (defaultResponse?.data && Array.isArray(defaultResponse.data)) defaultTagsArray = defaultResponse.data;
          else if (defaultResponse?.success && defaultResponse.data && Array.isArray(defaultResponse.data)) defaultTagsArray = defaultResponse.data;
          defaultTagNames = defaultTagsArray.map((t) => t.name || t.display_name || String(t));
        } catch { /* ignore */ }

        if (defaultTagNames.length === 0) defaultTagNames = ['Commander', 'Personal', 'Reestock', 'cEDH Staple'];
        dispatch({ type: 'SET_DEFAULT_TAGS', payload: defaultTagNames });

        try {
          const activeResponse = await tagsAPI.getActive();
          let activeTagsArray: Array<{ id: string; name: string; display_name?: string }> = [];
          if (Array.isArray(activeResponse)) activeTagsArray = activeResponse;
          else if (activeResponse?.data && Array.isArray(activeResponse.data)) activeTagsArray = activeResponse.data;
          else if (activeResponse?.success && activeResponse.data && Array.isArray(activeResponse.data)) activeTagsArray = activeResponse.data;
          _availableTagsRef.current = activeTagsArray.map((t) => ({ id: t.id, name: t.name, display_name: t.display_name || t.name }));
        } catch { /* ignore */ }
      } catch {
        dispatch({ type: 'SET_DEFAULT_TAGS', payload: ['Commander', 'Personal', 'Reestock', 'cEDH Staple'] });
      } finally {
        dispatch({ type: 'SET_LOADING_TAGS', payload: false });
      }
    };
    void loadTags();
  }, []);

  const handleApplyBulkTags = () => {
    if (state.bulkTags.length === 0) {
      toast.info('Selecciona al menos una etiqueta para aplicar');
      return;
    }
    const itemsToUpdate = items.filter((item) => item._isPending !== true);
    if (itemsToUpdate.length === 0) {
      toast.info('No hay productos disponibles para aplicar etiquetas');
      return;
    }
    let updatedCount = 0;
    items.forEach((item, index) => {
      if (item._isPending === true) return;
      const currentTags = item.tags || [];
      const mergedTags = [...new Set([...currentTags, ...state.bulkTags])];
      onUpdateItem(index, { tags: mergedTags });
      updatedCount++;
    });
    toast.success(`Se aplicaron ${state.bulkTags.length} etiqueta(s) a ${updatedCount} producto(s)`);
  };

  const handleSubmitToInventory = async () => {
    if (!selectedOwner) {
      toast.error('Error: No se ha seleccionado un propietario. Por favor, selecciona un propietario primero.');
      return;
    }
    if (!selectedCategory) {
      toast.error('Error: No se ha seleccionado una categoría. Por favor, selecciona una categoría primero.');
      return;
    }

    try {
      dispatch({ type: 'SET_SUBMITTING', payload: true });
      const validationErrors: string[] = [];
      items.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') validationErrors.push(`Producto ${index + 1}: El nombre es requerido`);
        if (!item.categoryId && !selectedCategory) validationErrors.push(`Producto ${index + 1} (${item.name}): La categoría es requerida`);
        if (!item.imageUrl || item.imageUrl.trim() === '') validationErrors.push(`Producto ${index + 1} (${item.name}): La URL de imagen es requerida`);
        if (item.price === undefined || item.price === null || Number(item.price) < 0) validationErrors.push(`Producto ${index + 1} (${item.name}): El precio debe ser mayor o igual a 0`);
      });

      if (validationErrors.length > 0) {
        toast.error(`Error de validación: ${validationErrors[0]}${validationErrors.length > 1 ? ` (+${validationErrors.length - 1} más)` : ''}`);
        dispatch({ type: 'SET_SUBMITTING', payload: false });
        return;
      }

      const itemsToProcess = items.filter((item) => item._isPending !== true);
      if (itemsToProcess.length === 0) {
        toast.error('No hay productos para agregar. Por favor acepta las cartas pendientes primero.');
        dispatch({ type: 'SET_SUBMITTING', payload: false });
        return;
      }

      const productsToCreate = itemsToProcess.map((item) => ({
        borderless: item.isBorderless || false,
        cardName: (item.name || '').trim(),
        cardNumber: item.cardNumber || '',
        category_id: item.categoryId || selectedCategory?.id || '',
        condition_id: item.conditionId || null,
        expansion: item.expansion || '',
        extendedArt: item.extendedArt || false,
        finalPrice: Number(item.price) || 0,
        foil: item.isFoil || false,
        importationId: item.importationId || item.importationProductId || '',
        img: item.imageUrl?.trim() || (Array.isArray(item.imageUrls) && item.imageUrls.length > 0 ? item.imageUrls[0] : '') || '/placeholder-product.png',
        isLocalInventory: true,
        language_id: item.languageId || null,
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
        tcg_id: item.tcgId || selectedTcg?.id,
      }));

      const allAreFullSingles = productsToCreate.every((p) => p.condition_id && p.language_id);
      let bulkResult;

      if (allAreFullSingles) {
        try {
          bulkResult = await singlesAPI.createBulk(productsToCreate);
        } catch { /* fallback */ }
      }

      if (bulkResult && bulkResult.success) {
        const createdCount = bulkResult.createdCount || bulkResult.created?.length || 0;
        const failedCount = bulkResult.failedCount || bulkResult.failed?.length || 0;
        if (failedCount > 0) toast.warning(`Se crearon ${createdCount} producto(s) correctamente. ${failedCount} producto(s) fallaron.`);
        else toast.success(`¡Éxito! Se agregaron ${createdCount} producto(s) al inventario.`);
      } else {
        const settled = await Promise.allSettled(
          productsToCreate.map(async (product, i) => {
            if (product.condition_id && product.language_id) return { action: 'created', product: await singlesAPI.create(product) };
            const originalItem = itemsToProcess[i];
            const bundleData = { ...product, price: `$${Number(originalItem.price).toFixed(2)} MXN` };
            return { action: 'created', product: await singlesAPI.createBundle(bundleData) };
          })
        );
        const results = settled.map((r) => (r.status === 'fulfilled' ? r.value : { action: 'failed' }));
        const createdCount = results.filter((r) => r.action === 'created').length;
        const failedCount = results.filter((r) => r.action === 'failed').length;
        if (failedCount > 0) toast.warning(`Se crearon ${createdCount} producto(s) correctamente. ${failedCount} producto(s) fallaron.`);
        else toast.success(`¡Éxito! Se agregaron ${createdCount} producto(s) al inventario.`);
      }
      onClearAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al conectar con el servidor.');
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  return {
    state,
    dispatch,
    handleApplyBulkTags,
    handleSubmitToInventory,
  };
}
