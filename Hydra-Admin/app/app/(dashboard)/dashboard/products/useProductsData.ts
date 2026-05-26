import { useCallback, useEffect } from 'react';
import { singlesAPI, tcgsAPI, conditionsAPI, languagesAPI, usersAPI, categoriesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { type ProductsApiResponse, type ProductsResponse, mapApiProductToProduct } from './types';
import type { ProductsState, ProductsAction } from './products-reducer';

export function useProductsData(state: ProductsState, dispatch: React.Dispatch<ProductsAction>) {
  const {
    debouncedSearch, page, limit, activeTab, ownerFilter, selectedTcg, hideOutOfStock
  } = state;

  const fetchProducts = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const ownerId = ownerFilter === 'all' ? undefined : ownerFilter;
      const categoryId = activeTab === 'all' ? undefined : activeTab;
      const tcgId = selectedTcg === 'all' ? undefined : selectedTcg;

      const res = await singlesAPI.list(
        page,
        limit,
        debouncedSearch,
        categoryId,
        hideOutOfStock ? true : undefined,
        ownerId,
        tcgId
      ) as ProductsApiResponse;

      const productData: ProductsResponse = res?.data;
      const rawData = productData?.data ?? productData;
      const data = Array.isArray(rawData) ? rawData : [];
      const totalCount = productData?.meta?.total || data.length;
      const totalPagesCount = productData?.meta?.totalPages || Math.ceil(totalCount / limit);

      dispatch({ type: 'SET_API_PRODUCTS', products: data });
      dispatch({ type: 'SET_PRODUCTS', products: data.map(mapApiProductToProduct) });
      dispatch({ type: 'SET_PAGINATION', total: totalCount, totalPages: totalPagesCount });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, [page, limit, debouncedSearch, activeTab, ownerFilter, selectedTcg, hideOutOfStock, dispatch]);

  // Initial Metadata Loading
  useEffect(() => {
    tcgsAPI.active().then(res => {
      const data = Array.isArray(res) ? res as { id: string; name: string; display_name?: string }[] : (res as { data: { id: string; name: string; display_name?: string }[] })?.data || [];
      dispatch({ type: 'SET_TCGS', tcgs: data });
    }).catch(() => {});

    conditionsAPI.list().then(res => {
      const data = Array.isArray(res) ? res as { id: string; name: string; display_name?: string }[] : (res as { data: { id: string; name: string; display_name?: string }[] })?.data || [];
      dispatch({ type: 'SET_CONDITIONS', conditions: data });
    }).catch(() => {});

    languagesAPI.list().then(res => {
      const data = Array.isArray(res) ? res as { id: string; name: string; display_name?: string }[] : (res as { data: { id: string; name: string; display_name?: string }[] })?.data || [];
      dispatch({ type: 'SET_LANGUAGES', languages: data });
    }).catch(() => {});

    usersAPI.list(undefined, true).then(res => {
      const r = res as { data?: { data?: { id: string; email: string; firstName?: string; lastName?: string }[] } };
      const data = Array.isArray(res) ? res as { id: string; email: string; firstName?: string; lastName?: string }[] : (r?.data?.data || []) as { id: string; email: string; firstName?: string; lastName?: string }[];
      dispatch({ type: 'SET_USERS', users: data });
    }).catch(() => {});
  }, [dispatch]);

  // Categories loading based on selected TCG
  useEffect(() => {
    const tcgId = selectedTcg === 'all' ? undefined : selectedTcg;
    categoriesAPI.getActive(tcgId).then(res => {
      const raw = Array.isArray(res) ? res as { id: string; name: string; display_name?: string; is_active?: boolean }[] : (res as { data: { id: string; name: string; display_name?: string; is_active?: boolean }[] })?.data || [];
      dispatch({ type: 'SET_CATEGORIES', categories: raw.filter((c) => c.is_active !== false) });
    }).catch(() => {});
  }, [selectedTcg, dispatch]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { fetchProducts };
}
