'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Add24Regular, Box24Regular } from '@fluentui/react-icons';
import { singlesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';


import { ProductsMobileView } from './components/ProductsMobileView';
import { ProductsDesktopView } from './components/ProductsDesktopView';
import { ProductsFilter } from './components/ProductsFilter';
import { ProductsCategoryTabs } from './components/ProductsCategoryTabs';
import { ProductsPagination } from './components/ProductsPagination';
import { productsReducer, initialProductsState } from './products-reducer';
import { type Product } from './types';
import { useProductsData } from './useProductsData';

export default function ProductsContent() {
  const { push } = useRouter();
  const [state, dispatch] = useReducer(productsReducer, initialProductsState);
  const {
    products, isLoading, isDeleting, total, totalPages,
    tcgs, conditions, categories, updatingStock, updatingCondition, updatingOwner, updatingLanguage,
    users, languages, searchTerm, debouncedSearch, page, limit,
    activeTab, hideOutOfStock, ownerFilter, ownerOpen, selectedTcg,
    selectedIds,
  } = state;

  const { fetchProducts } = useProductsData(state, dispatch);

  // ─── Search Debounce ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'SET_DEBOUNCED_SEARCH', term: searchTerm }), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch]);

  const prevSearch = useRef(debouncedSearch);
  if (debouncedSearch !== prevSearch.current) {
    prevSearch.current = debouncedSearch;
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleStockChange = useCallback(async (product: Product, delta: number) => {
    const newStock = product.stock + delta;
    if (newStock < 1) {
      if (!confirm(`Stock will reach 0 for "${product.name}". Delete this product?`)) return;
      dispatch({ type: 'SET_DELETING', deleting: true });
      try {
        await singlesAPI.delete(product.id);
        dispatch({ type: 'SET_PRODUCTS', products: products.filter(p => p.id !== product.id) });
        dispatch({ type: 'SET_PAGINATION', total: total - 1, totalPages });
        toast.success('Product deleted');
      } catch { toast.error('Failed to delete product'); }
      finally { dispatch({ type: 'SET_DELETING', deleting: false }); }
      return;
    }

    dispatch({ type: 'SET_UPDATING', key: 'Stock', id: product.id, isUpdating: true });
    dispatch({ type: 'SET_PRODUCTS', products: products.map(p => p.id === product.id ? { ...p, stock: newStock } : p) });
    try { await singlesAPI.update(product.id, { stock: newStock }); }
    catch {
      dispatch({ type: 'SET_PRODUCTS', products: products.map(p => p.id === product.id ? { ...p, stock: product.stock } : p) });
      toast.error('Failed to update stock');
    } finally { dispatch({ type: 'SET_UPDATING', key: 'Stock', id: product.id, isUpdating: false }); }
  }, [products, total, totalPages, dispatch]);

  const handleConditionChange = useCallback(async (product: Product, conditionId: string) => {
    dispatch({ type: 'SET_UPDATING', key: 'Condition', id: product.id, isUpdating: true });
    const cond = conditions.find(c => c.id === conditionId);
    const condName = cond?.display_name || cond?.name || '';
    dispatch({
      type: 'SET_PRODUCTS',
      products: products.map(p => p.id === product.id ? { ...p, condition: condName.toLowerCase().replace(/\s+/g, '-'), condition_id: conditionId } : p)
    });
    try {
      await singlesAPI.update(product.id, { condition_id: conditionId });
      toast.success('Condition updated');
    } catch {
      dispatch({ type: 'SET_PRODUCTS', products: products.map(p => p.id === product.id ? { ...p, condition: product.condition, condition_id: product.condition_id } : p) });
      toast.error('Failed to update condition');
    } finally { dispatch({ type: 'SET_UPDATING', key: 'Condition', id: product.id, isUpdating: false }); }
  }, [products, conditions, dispatch]);

  const toggleSelect = useCallback((id: string) => dispatch({ type: 'TOGGLE_SELECT', id }), [dispatch]);
  const toggleSelectAll = useCallback(() => dispatch({ type: 'TOGGLE_SELECT_ALL' }), [dispatch]);

  const handleBulkDelete = useCallback(async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} products?`)) return;
    dispatch({ type: 'SET_DELETING', deleting: true });
    try {
      await Promise.all(Array.from(selectedIds).map(id => singlesAPI.delete(id)));
      toast.success('Products deleted');
      dispatch({ type: 'CLEAR_SELECTION' });
      fetchProducts();
    } catch { toast.error('Some deletions failed'); }
    finally { dispatch({ type: 'SET_DELETING', deleting: false }); }
  }, [selectedIds, dispatch, fetchProducts]);

  const handleDeleteProduct = useCallback((id: string) => {
    const p = products.find(x => x.id === id);
    if (p) handleStockChange(p, -p.stock);
  }, [products, handleStockChange]);

  const handleOwnerChange = useCallback(async (p: Product, v: string) => {
    dispatch({ type: 'SET_UPDATING', key: 'Owner', id: p.id, isUpdating: true });
    
    // Optimistic update
    dispatch({
      type: 'SET_PRODUCTS',
      products: products.map(prod => prod.id === p.id ? { ...prod, owner_id: v } : prod)
    });

    try { 
      await singlesAPI.update(p.id, { owner_id: v }); 
      toast.success('Owner updated'); 
    } catch { 
      // Revert on error
      dispatch({
        type: 'SET_PRODUCTS',
        products: products
      });
      toast.error('Failed to update owner'); 
    } finally { 
      dispatch({ type: 'SET_UPDATING', key: 'Owner', id: p.id, isUpdating: false }); 
    }
  }, [products, dispatch]);

  const handleLanguageChange = useCallback(async (p: Product, v: string) => {
    dispatch({ type: 'SET_UPDATING', key: 'Language', id: p.id, isUpdating: true });
    
    // Optimistic update
    dispatch({
      type: 'SET_PRODUCTS',
      products: products.map(prod => prod.id === p.id ? { ...prod, language_id: v } : prod)
    });

    try { 
      await singlesAPI.update(p.id, { language_id: v }); 
      toast.success('Language updated'); 
    } catch { 
      // Revert on error
      dispatch({
        type: 'SET_PRODUCTS',
        products: products
      });
      toast.error('Failed to update language'); 
    } finally { 
      dispatch({ type: 'SET_UPDATING', key: 'Language', id: p.id, isUpdating: false }); 
    }
  }, [products, dispatch]);

  const handleToggleTag = useCallback(async (productId: string, tagName: string, hasTag: boolean) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentTagNames = product.tags || [];
    const nextTags = hasTag
      ? currentTagNames.filter(t => t.toLowerCase() !== tagName.toLowerCase())
      : [...currentTagNames, tagName];

    // Optimistic update of product tags in the local state
    dispatch({
      type: 'SET_PRODUCTS',
      products: products.map(p => p.id === productId ? { ...p, tags: nextTags } : p)
    });

    try {
      await singlesAPI.updateTags(productId, nextTags);
    } catch {
      // Revert optimistic update
      dispatch({
        type: 'SET_PRODUCTS',
        products: products
      });
      toast.error('Failed to update tag');
    }
  }, [products, dispatch]);

  const handleToggleFoil = useCallback(async (productId: string, currentFoil: boolean) => {
    // Optimistic update
    dispatch({
      type: 'SET_PRODUCTS',
      products: products.map(p => p.id === productId ? { ...p, foil: !currentFoil } : p)
    });

    try {
      await singlesAPI.updateFoil(productId, !currentFoil);
    } catch { 
      // Revert on error
      dispatch({
        type: 'SET_PRODUCTS',
        products: products
      });
      toast.error('Failed to update foil status'); 
    }
  }, [products, dispatch]);

  const handleSort = useCallback((field: keyof Product) => dispatch({ type: 'SET_SORT', field }), [dispatch]);

  const handleEditProduct = useCallback((p: Product) => push(`/dashboard/products/${p.id}/edit`), [push]);

  return (
    <PageLayout>
      <PageHeader
        title="Inventario"
        description="Gestiona tu catálogo de productos y existencias"
        action={
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isDeleting}>
                Eliminar ({selectedIds.size})
              </Button>
            )}
            <Button size="sm" onClick={() => push('/dashboard/products/add')} className="gap-2">
              <Add24Regular className="size-4" />
              Nuevo Producto
            </Button>
          </div>
        }
      />

      <ProductsCategoryTabs
        activeTab={activeTab}
        categories={categories}
        onTabChange={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', tab })}
      />

      <ProductsFilter
        searchTerm={searchTerm}
        onSearchChange={(term) => dispatch({ type: 'SET_SEARCH', term })}
        selectedTcg={selectedTcg}
        onTcgChange={(tcg) => dispatch({ type: 'SET_SELECTED_TCG', tcg })}
        tcgs={tcgs}
        ownerFilter={ownerFilter}
        onOwnerChange={(id) => dispatch({ type: 'SET_OWNER_FILTER', filter: id })}
        ownerOpen={ownerOpen}
        onOwnerOpenChange={(open) => dispatch({ type: 'SET_OWNER_OPEN', open })}
        users={users}
        hideOutOfStock={hideOutOfStock}
        onHideOutOfStockChange={(hide) => dispatch({ type: 'SET_HIDE_OUT_OF_STOCK', hide })}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {['sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'sk6', 'sk7', 'sk8'].map((id) => (
            <div key={id} className="h-[380px] rounded-2xl bg-primary/[0.03] animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center glass-card bg-primary/[0.01]">
          <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
            <Box24Regular className="size-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold text-foreground/80">No se encontraron productos</h3>
          <p className="text-sm text-muted-foreground max-w-xs mt-1">
            Intenta ajustar los filtros o realiza una nueva búsqueda.
          </p>
        </div>
      ) : (
        <>
          <ProductsDesktopView
            sortedProducts={products}
            selectedIds={selectedIds}
            allSelected={selectedIds.size === products.length && products.length > 0}
            someSelected={selectedIds.size > 0 && selectedIds.size < products.length}
            sortField={state.sortField}
            sortDirection={state.sortDirection}
            toggleSelect={toggleSelect}
            toggleSelectAll={toggleSelectAll}
            handleSort={handleSort}
            handleEditProduct={handleEditProduct}
            handleDeleteProduct={handleDeleteProduct}
            handleStockChange={handleStockChange}
            handleConditionChange={handleConditionChange}
            handleOwnerChange={handleOwnerChange}
            handleLanguageChange={handleLanguageChange}
            handleToggleTag={handleToggleTag}
            handleToggleFoil={handleToggleFoil}
            updatingStock={updatingStock}
            updatingCondition={updatingCondition}
            updatingOwner={updatingOwner}
            updatingLanguage={updatingLanguage}
            isDeleting={isDeleting}
            conditions={conditions}
            users={users}
            languages={languages}
          />
          <ProductsMobileView
            sortedProducts={products}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            handleEditProduct={handleEditProduct}
            handleDeleteProduct={handleDeleteProduct}
            handleStockChange={handleStockChange}
            handleConditionChange={handleConditionChange}
            handleOwnerChange={handleOwnerChange}
            handleLanguageChange={handleLanguageChange}
            handleToggleTag={handleToggleTag}
            updatingStock={updatingStock}
            updatingCondition={updatingCondition}
            updatingOwner={updatingOwner}
            updatingLanguage={updatingLanguage}
            isDeleting={isDeleting}
            conditions={conditions}
            users={users}
            languages={languages}
          />

          <ProductsPagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={(p) => dispatch({ type: 'SET_PAGE', page: p })}
            onLimitChange={(l) => dispatch({ type: 'SET_LIMIT', limit: l })}
            isLoading={isLoading}
          />
        </>
      )}

    </PageLayout>
  );
}
