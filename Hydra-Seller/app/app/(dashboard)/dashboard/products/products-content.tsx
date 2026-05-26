'use client';

import type React from 'react';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  ArrowLeft24Regular,
  ArrowRight24Regular,
  SpinnerIos20Regular,
  Delete24Regular,
  Add24Regular,
} from '@fluentui/react-icons';
import { singlesAPI, conditionsAPI, languagesAPI, categoriesAPI, tcgsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { ProductFormDialog } from './product-form-dialog';

// Lucide Check and ChevronsUpDown removed from here as they are replaced by Fluent UI equivalents above
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { ProductsMobileView } from './components/ProductsMobileView';
import { ProductsDesktopView } from './components/ProductsDesktopView';
import {
  type ApiProduct,
  type Product,
  type ProductsResponse,
  mapApiProductToProduct,
} from './types';

export function ProductsContent() {
  const { push } = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Debounce search term to avoid too many requests
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState<keyof Product>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState('');
  const [tcgs, setTcgs] = useState<{ id: string; name: string; display_name?: string }[]>([]);
  const [selectedTcg, setSelectedTcg] = useState<string>('all');

  // Reset page when search changes (render-time to avoid effect chain)
  const prevDebouncedSearch = useRef(debouncedSearch);
  if (debouncedSearch !== prevDebouncedSearch.current) {
    prevDebouncedSearch.current = debouncedSearch;
    setPage(1);
  }

  // Get current user ID on mount
  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user?.id) setOwnerFilter(data.user.id);
      })
      .catch((e) => console.error('Error fetching session', e));
  }, []);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clear selection when page/tab/search changes (render-time to avoid effect chain)
  const prevSearchKey = useRef<{ d: string; p: number; t: string } | null>(null);
  const currentKey = { d: debouncedSearch, p: page, t: activeTab };
  if (
    !prevSearchKey.current ||
    prevSearchKey.current.d !== currentKey.d ||
    prevSearchKey.current.p !== currentKey.p ||
    prevSearchKey.current.t !== currentKey.t
  ) {
    prevSearchKey.current = currentKey;
    if (selectedIds.size > 0) {
      setSelectedIds(new Set());
    }
  }

  const [conditions, setConditions] = useState<
    { id: string; name: string; display_name?: string }[]
  >([]);
  const [categories, setCategories] = useState<
    { id: string; name: string; display_name?: string }[]
  >([]);
  const [updatingStock, setUpdatingStock] = useState<Set<string>>(new Set());
  const [updatingCondition, setUpdatingCondition] = useState<Set<string>>(new Set());

  const [updatingLanguage, setUpdatingLanguage] = useState<Set<string>>(new Set());
  const [languages, setLanguages] = useState<{ id: string; name: string; display_name?: string }[]>(
    []
  );

  // Load TCGs
  useEffect(() => {
    tcgsAPI
      .active()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        setTcgs(data);
      })
      .catch(() => {});
  }, []);

  // Load categories for tab filter
  useEffect(() => {
    const tcgId = selectedTcg === 'all' ? undefined : selectedTcg;
    categoriesAPI
      .getActive(tcgId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCategories(data.filter((c: any) => c.is_active !== false));
      })
      .catch(() => {});
  }, [selectedTcg]);

  // Load conditions and users for inline selectors
  useEffect(() => {
    conditionsAPI
      .list()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        setConditions(data);
      })
      .catch(() => {});

    languagesAPI
      .list()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        setLanguages(data);
      })
      .catch(() => {});
  }, []);

  const handleStockChange = async (product: Product, delta: number) => {
    const newStock = product.stock + delta;

    if (newStock < 1) {
      const confirmed = confirm(`Stock will reach 0 for "${product.name}". Delete this product?`);
      if (!confirmed) return;
      setIsDeleting(true);
      try {
        await singlesAPI.delete(product.id);
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        setApiProducts((prev) => prev.filter((p) => p.id !== product.id));
        setTotal((prev) => prev - 1);
        toast.success('Product deleted');
      } catch {
        toast.error('Failed to delete product');
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    setUpdatingStock((prev) => new Set(prev).add(product.id));
    // Optimistic update
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p)));
    try {
      await singlesAPI.update(product.id, { stock: newStock });
    } catch {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: product.stock } : p))
      );
      toast.error('Failed to update stock');
    } finally {
      setUpdatingStock((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const handleConditionChange = async (product: Product, conditionId: string) => {
    setUpdatingCondition((prev) => new Set(prev).add(product.id));
    const cond = conditions.find((c) => c.id === conditionId);
    const condName = cond?.display_name || cond?.name || '';
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              condition: condName.toLowerCase().replace(/\s+/g, '-'),
              condition_id: conditionId,
            }
          : p
      )
    );
    try {
      await singlesAPI.update(product.id, { condition_id: conditionId });
      toast.success('Condition updated');
    } catch {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, condition: product.condition, condition_id: product.condition_id }
            : p
        )
      );
      toast.error('Failed to update condition');
    } finally {
      setUpdatingCondition((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const handleLanguageChange = async (product: Product, languageId: string) => {
    setUpdatingLanguage((prev) => new Set(prev).add(product.id));
    const lang = languages.find((l) => l.id === languageId);
    const langName = lang?.display_name || lang?.name || '';
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, language: langName, language_id: languageId } : p
      )
    );
    try {
      await singlesAPI.update(product.id, { language_id: languageId });
      toast.success('Language updated');
    } catch {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, language: product.language, language_id: product.language_id }
            : p
        )
      );
      toast.error('Failed to update language');
    } finally {
      setUpdatingLanguage((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = (await singlesAPI.list(
        page,
        limit,
        debouncedSearch,
        activeTab === 'all' ? undefined : activeTab,
        hideOutOfStock || undefined,
        ownerFilter || undefined,
        selectedTcg === 'all' ? undefined : selectedTcg
      )) as ProductsResponse;

      let productsData: ApiProduct[] = [];
      let totalCount = 0;
      let calculatedTotalPages = 1;

      // Normalize response data
      if (response) {
        if (Array.isArray(response)) {
          // [Product, Product, ...]
          productsData = response;
          totalCount = response.length;
        } else if (response.data && Array.isArray(response.data)) {
          // { data: [Product, ...], meta: ... }
          productsData = response.data;
          totalCount = response.meta?.total || response.data.length || 0;
          calculatedTotalPages = response.meta?.totalPages || Math.ceil(totalCount / limit) || 1;
        } else if (
          response.data &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (response.data as any).data &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Array.isArray((response.data as any).data)
        ) {
          // { success: true, data: { data: [Product, ...], meta: ... } }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nested = response.data as any;
          productsData = nested.data;
          totalCount = nested.meta?.total || response.meta?.total || productsData.length || 0;
          calculatedTotalPages = nested.meta?.totalPages || Math.ceil(totalCount / limit) || 1;
        } else {
          // Unexpected structure — leave productsData empty
        }
      }

      setApiProducts(productsData);
      const mappedProducts = productsData.map(mapApiProductToProduct);
      setProducts(mappedProducts);
      setTotal(totalCount);
      setTotalPages(calculatedTotalPages);

      if (productsData.length === 0 && !Array.isArray(response)) {
        // Only warn if we really didn't find anything AND it wasn't an empty array response
        // But strict check above handles empty arrays fine.
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      setError(errorMessage);
      toast.error(errorMessage);
      setProducts([]);
      setApiProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, activeTab, hideOutOfStock, ownerFilter, selectedTcg]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products;

  const sortedProducts = filteredProducts.toSorted((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Selection helpers
  const allSelected =
    sortedProducts.length > 0 && sortedProducts.every((p) => selectedIds.has(p.id));
  const someSelected = sortedProducts.some((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedProducts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} product(s)?`)) return;

    setIsDeleting(true);
    const idsToDelete = Array.from(selectedIds);
    try {
      await singlesAPI.deleteBulk(idsToDelete);
      setProducts((prev) => prev.filter((p) => !idsToDelete.includes(p.id)));
      setApiProducts((prev) => prev.filter((p) => !idsToDelete.includes(p.id)));
      setTotal((prev) => prev - idsToDelete.length);
      setSelectedIds(new Set());
      toast.success(`${idsToDelete.length} product(s) deleted successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete products';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await singlesAPI.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setApiProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
      toast.success('Product deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleTag = async (productId: string, tagName: string, hasTag: boolean) => {
    // Store previous state for rollback on error
    let previousApiProducts: ApiProduct[] = [];
    let previousProducts: Product[] = [];

    // Calculate new tags using functional update to ensure we always work with latest state
    // We need to calculate this BEFORE the API call, so we use setState's callback to get the value
    let calculatedNewTags: string[] = [];

    // Optimistic update - update state immediately before API call
    setApiProducts((prevApiProducts) => {
      previousApiProducts = [...prevApiProducts];
      const apiProduct = prevApiProducts.find((p) => p.id === productId);
      if (!apiProduct) return prevApiProducts;

      const currentTags = apiProduct.tags || [];

      if (hasTag) {
        // Remove tag
        calculatedNewTags = currentTags.reduce<string[]>((acc, t) => {
          if (t.name.toLowerCase() !== tagName.toLowerCase()) acc.push(t.name);
          return acc;
        }, []);
      } else {
        // Add tag
        const existingTagNames = currentTags.map((t) => t.name.toLowerCase());
        if (!existingTagNames.includes(tagName.toLowerCase())) {
          calculatedNewTags = [...currentTags.map((t) => t.name), tagName];
        } else {
          calculatedNewTags = currentTags.map((t) => t.name);
        }
      }

      // Update the product with new tags
      const updatedApiProducts = prevApiProducts.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            tags: calculatedNewTags.map((tagName) => ({
              id: tagName, // Temporary ID, will be updated on next full fetch
              name: tagName,
              display_name: tagName,
            })),
          };
        }
        return p;
      });

      // Update mapped products as well
      const updatedProducts = updatedApiProducts.map(mapApiProductToProduct);
      previousProducts = [...updatedProducts];
      setProducts(updatedProducts);

      return updatedApiProducts;
    });

    // Now make the API call with the calculated newTags
    // Use a small delay to ensure the setState callback has executed and calculatedNewTags is set
    try {
      // Calculate tags directly from current state as fallback
      const apiProduct = apiProducts.find((p) => p.id === productId);
      if (!apiProduct) {
        toast.error('Product not found');
        return;
      }

      const currentTags = apiProduct.tags || [];
      let newTags: string[];

      if (hasTag) {
        // Remove tag
        newTags = currentTags.reduce<string[]>((acc, t) => {
          if (t.name.toLowerCase() !== tagName.toLowerCase()) acc.push(t.name);
          return acc;
        }, []);
      } else {
        // Add tag
        const existingTagNames = currentTags.map((t) => t.name.toLowerCase());
        if (!existingTagNames.includes(tagName.toLowerCase())) {
          newTags = [...currentTags.map((t) => t.name), tagName];
        } else {
          newTags = currentTags.map((t) => t.name);
        }
      }

      await singlesAPI.updateTags(productId, newTags);
      toast.success(`Tag "${tagName}" ${hasTag ? 'removed' : 'added'} successfully`);
    } catch (err) {
      // Revert optimistic update on error
      setApiProducts(previousApiProducts);
      setProducts(previousProducts);

      const errorMessage = err instanceof Error ? err.message : 'Failed to update tags';
      toast.error(errorMessage);
    }
  };

  const handleToggleFoil = async (productId: string, currentFoil: boolean) => {
    try {
      const newFoil = !currentFoil;
      await singlesAPI.updateFoil(productId, newFoil);

      // Update local state instead of reloading entire list
      const updatedApiProducts = apiProducts.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            foil: newFoil,
          };
        }
        return p;
      });

      setApiProducts(updatedApiProducts);

      // Update mapped products as well
      const updatedProducts = updatedApiProducts.map(mapApiProductToProduct);
      setProducts(updatedProducts);

      toast.success(`Foil ${newFoil ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update foil status';
      toast.error(errorMessage);
    }
  };

  const handleAddProduct = () => {
    push('/dashboard/products/add');
  };

  const handleEditProduct = (product: Product) => {
    push(`/dashboard/products/${product.id}/edit`);
  };

  const handleSuccess = () => {
    fetchProducts();
  };

  return (
    <PageLayout>
      <PageHeader
        title="Mi Inventario"
        description="Gestiona y sincroniza tus productos"
        action={
          <Button
            onClick={handleAddProduct}
            className="w-full sm:w-auto h-12 px-8 rounded-xl font-semibold text-[10px] uppercase tracking-[0.25em] shadow-playful hover:scale-105 active:scale-95 transition-all"
          >
            <Add24Regular className="mr-3 size-4" />
            <span>Agregar Producto</span>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-6 mb-12">
        <div className="relative flex-1 min-w-[280px] group">
          <Search24Regular className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar por nombre, set o ID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 bg-card border-none ring-1 ring-primary/5 focus:ring-primary/20 transition-all rounded-xl placeholder:text-muted-foreground/30 font-bold text-xs uppercase tracking-widest"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className={cn(
              'h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all',
              hideOutOfStock
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-card text-foreground/40 hover:text-foreground'
            )}
            onClick={() => {
              setHideOutOfStock((v) => !v);
              setPage(1);
            }}
          >
            {hideOutOfStock ? 'Sin stock oculto' : 'Filtros activos'}
          </Button>
        </div>
      </div>

      <div className="glass-card border-none overflow-hidden flex flex-col">
        <div className="px-8 pt-8 pb-6 border-b border-primary/5 flex flex-col sm:flex-row sm:items-end justify-between gap-10">
          <div className="space-y-6 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
                  Mis Productos
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-0.5">
                  Mostrando {filteredProducts.length} de {total} items &bull; Página {page} de{' '}
                  {totalPages}
                </p>
              </div>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-4 bg-destructive/5 px-4 py-2 rounded-xl ring-1 ring-destructive/10 animate-in fade-in slide-in-from-right-4">
                  <span className="text-[10px] font-black text-destructive uppercase tracking-widest">
                    {selectedIds.size} seleccionados
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 rounded-lg font-black text-[10px] uppercase tracking-widest"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <SpinnerIos20Regular className="size-3 animate-spin" />
                    ) : (
                      <Delete24Regular className="size-3 mr-2" />
                    )}
                    Eliminar
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] px-1">
                  Filtrar por TCG
                </span>
                <Select
                  value={selectedTcg}
                  onValueChange={(v: string) => {
                    setSelectedTcg(v);
                    setActiveTab('all');
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-12 bg-muted/30 border-none rounded-2xl px-6 font-black text-[10px] uppercase tracking-widest focus:ring-primary/20">
                    <SelectValue placeholder="Seleccionar TCG" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-none shadow-2xl rounded-2xl">
                    <SelectItem
                      value="all"
                      className="rounded-lg py-3 font-black text-[10px] uppercase tracking-widest focus:bg-primary focus:text-primary-foreground"
                    >
                      Todos
                    </SelectItem>
                    {tcgs.map((tcg) => (
                      <SelectItem
                        key={tcg.id}
                        value={tcg.id}
                        className="rounded-lg py-3 font-black text-[10px] uppercase tracking-widest focus:bg-primary focus:text-primary-foreground"
                      >
                        {tcg.display_name || tcg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] px-1">
                  Filtrar por Categoría
                </span>
                <Select
                  value={activeTab}
                  onValueChange={(v: string) => {
                    setActiveTab(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-12 bg-muted/30 border-none rounded-2xl px-6 font-black text-[10px] uppercase tracking-widest focus:ring-primary/20">
                    <SelectValue placeholder="Seleccionar Categoría" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-none shadow-2xl rounded-2xl">
                    <SelectItem
                      value="all"
                      className="rounded-lg py-3 font-black text-[10px] uppercase tracking-widest focus:bg-primary focus:text-primary-foreground"
                    >
                      Todas
                    </SelectItem>
                    {categories.map((cat) => (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                        className="rounded-lg py-3 font-black text-[10px] uppercase tracking-widest focus:bg-primary focus:text-primary-foreground"
                      >
                        {cat.display_name || cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center text-center gap-y-4">
              <div className="p-4 rounded-2xl bg-primary/5 ring-1 ring-primary/10">
                <SpinnerIos20Regular className="size-8 text-primary animate-spin" />
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.25em]">
                Sincronizando inventario…
              </p>
            </div>
          ) : error ? (
            <div className="py-32 flex flex-col items-center justify-center text-center gap-y-4">
              <div className="p-4 rounded-2xl bg-destructive/5 ring-1 ring-destructive/10 text-destructive font-black text-xl">
                !
              </div>
              <p className="text-[10px] font-black text-destructive/60 uppercase tracking-[0.25em]">
                Error: {error}
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center gap-y-4">
              <div className="p-4 rounded-2xl bg-muted/30 ring-1 ring-primary/5 text-muted-foreground/20 font-black text-xl">
                ?
              </div>
              <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.25em]">
                No se encontraron productos
              </p>
            </div>
          ) : (
            <div className="p-6 sm:p-10">
              <ProductsMobileView
                sortedProducts={sortedProducts}
                apiProducts={apiProducts}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                handleEditProduct={handleEditProduct}
                handleDeleteProduct={handleDeleteProduct}
                handleStockChange={handleStockChange}
                handleConditionChange={handleConditionChange}
                handleLanguageChange={handleLanguageChange}
                handleToggleTag={handleToggleTag}
                updatingStock={updatingStock}
                updatingCondition={updatingCondition}
                updatingLanguage={updatingLanguage}
                isDeleting={isDeleting}
                conditions={conditions}
                languages={languages}
              />

              <ProductsDesktopView
                sortedProducts={sortedProducts}
                apiProducts={apiProducts}
                selectedIds={selectedIds}
                allSelected={allSelected}
                someSelected={someSelected}
                sortField={sortField}
                sortDirection={sortDirection}
                toggleSelect={toggleSelect}
                toggleSelectAll={toggleSelectAll}
                handleSort={handleSort}
                handleEditProduct={handleEditProduct}
                handleDeleteProduct={handleDeleteProduct}
                handleStockChange={handleStockChange}
                handleConditionChange={handleConditionChange}
                handleLanguageChange={handleLanguageChange}
                handleToggleTag={handleToggleTag}
                handleToggleFoil={handleToggleFoil}
                updatingStock={updatingStock}
                updatingCondition={updatingCondition}
                updatingLanguage={updatingLanguage}
                isDeleting={isDeleting}
                conditions={conditions}
                languages={languages}
              />
            </div>
          )}

          {/* Pagination */}
          {!isLoading && (products.length > 0 || total > 0) && (
            <div className="p-4 sm:p-6 pt-4 border-t border-border bg-muted/30 sticky bottom-0 z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Left: count + rows per page */}
                <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                  <span>
                    {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} /{' '}
                    {total}
                  </span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-7 w-16 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                {/* Right: page buttons + jump input */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => setPage(1)}
                    disabled={page === 1 || isLoading}
                  >
                    <ArrowLeft24Regular className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft24Regular className="size-3.5" />
                  </Button>

                  {/* Numbered pages */}
                  {(() => {
                    const delta = 2;
                    type PageEntry = { label: number | '...'; key: string };
                    const pages: PageEntry[] = [];
                    const left = Math.max(2, page - delta);
                    const right = Math.min(totalPages - 1, page + delta);
                    pages.push({ label: 1, key: '1' });
                    if (left > 2) pages.push({ label: '...', key: 'ellipsis-left' });
                    for (let i = left; i <= right; i++) pages.push({ label: i, key: String(i) });
                    if (right < totalPages - 1) pages.push({ label: '...', key: 'ellipsis-right' });
                    if (totalPages > 1) pages.push({ label: totalPages, key: String(totalPages) });
                    return pages.map((p) =>
                      p.label === '...' ? (
                        <span key={p.key} className="px-1 text-xs text-muted-foreground">
                          …
                        </span>
                      ) : (
                        <Button
                          key={p.key}
                          variant={p.label === page ? 'default' : 'outline'}
                          size="icon"
                          className="size-7 text-xs"
                          onClick={() => setPage(p.label as number)}
                          disabled={isLoading}
                        >
                          {p.label}
                        </Button>
                      )
                    );
                  })()}

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages || isLoading}
                  >
                    <ChevronRight24Regular className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages || isLoading}
                  >
                    <ArrowRight24Regular className="size-3.5" />
                  </Button>

                  {/* Jump to page */}
                  <div className="flex items-center gap-1 ml-2">
                    <input
                      name="jump"
                      type="number"
                      min={1}
                      max={totalPages}
                      placeholder="Ir a…"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseInt((e.currentTarget as HTMLInputElement).value, 10);
                          if (val >= 1 && val <= totalPages) {
                            setPage(val);
                            (e.currentTarget as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="h-7 w-16 rounded-lg border border-input bg-background px-2 text-[10px] font-black uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <ProductFormDialog
        open={isAddOpen}
        onOpenChange={(_, data) => setIsAddOpen(data.open)}
        product={null}
        onSuccess={handleSuccess}
        defaultCategory={
          activeTab === 'bundles'
            ? 'e226dd16-6577-40fa-8d91-59f8e35ea167' // BUNDLE
            : activeTab === 'singles'
              ? 'a78b1ded-65b6-4c88-8a03-1dc7683709ae' // SINGLES
              : undefined
        }
      />
    </PageLayout>
  );
}
