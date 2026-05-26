'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ordersAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useModal } from '@/components/providers/modal-context';
import type { Order, OrderItem } from '@/lib/types';

interface BackendOrderUser {
  id?: string;
  _id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  role?: string;
  isActive?: boolean;
  created_at?: string;
}

interface BackendOrderItemProduct {
  id?: string;
  _id?: string;
  name?: string;
  title?: string;
  expansion?: string;
  set_name?: string;
  rarities?: { name?: string };
  price?: unknown;
  in_stock?: unknown;
  inStock?: unknown;
  conditions?: { display_name?: string; name?: string };
  condition?: string;
}

interface BackendOrderItem {
  id?: string;
  _id?: string;
  product_id?: string;
  productId?: string;
  products?: BackendOrderItemProduct;
  product?: BackendOrderItemProduct;
  name?: string;
  productName?: string;
  quantity?: unknown;
  unit_price?: unknown;
  price?: unknown;
  total_price?: unknown;
}

interface BackendOrderPayment {
  paymentMethod?: string;
  status?: string;
}

interface BackendOrderData {
  [key: string]: unknown;
  id?: string;
  _id?: string;
  userId?: string;
  user_id?: string;
  users?: BackendOrderUser;
  user_email?: string;
  customer_name?: string;
  customer_email?: string;
  customer?: string;
  email?: string;
  status?: string;
  total_amount?: unknown;
  total?: unknown;
  order_items?: BackendOrderItem[];
  order_number?: string;
  orderNumber?: string;
  createdAt?: string;
  created_at?: string;
  orderDate?: string;
  shipping_date?: string;
  shippingDate?: string;
  delivery_location_id?: string;
  deliveryLocationId?: string;
  delivery_point_id?: string;
  deliveryPointId?: string;
  payment?: BackendOrderPayment;
  payment_method?: string;
  payment_status?: string;
}

function mapBackendOrderToOrder(backendOrder: BackendOrderData): Order {
  const user =
    backendOrder.userId || backendOrder.user_id || backendOrder.users
      ? {
          id: backendOrder.userId || backendOrder.user_id || backendOrder.users?.id || backendOrder.users?._id,
          email: backendOrder.users?.email || backendOrder.user_email || '',
          name: (() => {
            const u = backendOrder.users;
            if (!u) return 'Usuario';
            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
            return fullName || u.username || u.email || 'Usuario';
          })(),
          role: backendOrder.users?.role || 'user',
          status: backendOrder.users?.isActive !== false ? 'active' : 'inactive',
          joinDate: backendOrder.users?.created_at || new Date().toISOString(),
        }
      : undefined;

  return {
    id: backendOrder.id || backendOrder._id || '',
    orderNumber: backendOrder.order_number || backendOrder.orderNumber || `ORD-${(backendOrder.id || backendOrder._id || '').slice(-6).toUpperCase()}`,
    user,
    customer: user?.name || backendOrder.customer_name || backendOrder.customer || 'Usuario',
    email: user?.email || backendOrder.customer_email || backendOrder.email || '',
    status: (() => {
      const s = (backendOrder.status || 'pending').toUpperCase();
      if (s === 'PAID') return 'paid';
      if (s === 'PROCESSING') return 'processing';
      if (s === 'COMPLETED') return 'delivered';
      return s.toLowerCase();
    })(),
    total: Number(backendOrder.total_amount) || Number(backendOrder.total) || 0,
    items: (backendOrder.order_items || []).map((item: BackendOrderItem) => {
      const product = item.products || item.product;
      return {
        id: item.id || item._id || '',
        productId: item.product_id || item.productId,
        productName: product?.name || product?.title || item.name || item.productName || '',
        quantity: Number(item.quantity) || 1,
        price: typeof item.unit_price === 'number' ? item.unit_price : typeof item.price === 'number' ? item.price : 0,
        unitPrice: typeof item.unit_price === 'number' ? item.unit_price : typeof item.price === 'number' ? item.price : 0,
        totalPrice: typeof item.total_price === 'number' ? item.total_price : (typeof item.unit_price === 'number' ? item.unit_price : typeof item.price === 'number' ? item.price : 0) * (Number(item.quantity) || 1),
        product: product ? {
          id: product.id || product._id,
          name: product.name || product.title || '',
          cardSet: product.expansion || product.set_name || '',
          rarity: product.rarities?.name || 'rare',
          price: typeof product.price === 'number' ? product.price : 0,
          stock: Number(product.in_stock) || Number(product.inStock) || 0,
          condition: product.conditions?.display_name || product.conditions?.name || product.condition || 'near-mint',
        } : undefined,
      } as OrderItem;
    }),
    orderDate: backendOrder.createdAt || backendOrder.created_at || backendOrder.orderDate || '',
    shippingDate: backendOrder.shipping_date || backendOrder.shippingDate,
    deliveryLocationId: backendOrder.delivery_location_id || backendOrder.deliveryLocationId,
    deliveryPointId: backendOrder.delivery_point_id || backendOrder.deliveryPointId,
    paymentMethod: backendOrder.payment?.paymentMethod || backendOrder.payment_method || 'transfer',
    paymentStatus: backendOrder.payment?.status || backendOrder.payment_status || 'pending',
  };
}

interface FilterState {
  page: number;
  searchTerm: string;
  selectedStatus: string;
  userId: string;
  limit: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

type FilterAction =
  | { type: 'SET_PAGE'; page: number }
  | { type: 'SET_SEARCH'; search: string }
  | { type: 'SET_STATUS'; status: string }
  | { type: 'SET_USER_ID'; userId: string }
  | { type: 'SET_LIMIT'; limit: number }
  | { type: 'SET_SORT'; sortBy: string; sortDir: 'asc' | 'desc' }
  | { type: 'SET_FILTERS'; filters: Partial<FilterState> };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_PAGE': return { ...state, page: action.page };
    case 'SET_SEARCH': return { ...state, searchTerm: action.search, page: 1 };
    case 'SET_STATUS': return { ...state, selectedStatus: action.status, page: 1 };
    case 'SET_USER_ID': return { ...state, userId: action.userId, page: 1 };
    case 'SET_LIMIT': return { ...state, limit: action.limit, page: 1 };
    case 'SET_SORT': return { ...state, sortBy: action.sortBy, sortDir: action.sortDir, page: 1 };
    case 'SET_FILTERS': return { ...state, ...action.filters };
    default: return state;
  }
}

interface OrdersState {
  orders: Order[];
  isCreateOpen: boolean;
  isLoading: boolean;
  error: string | null;
  total: number;
  totalPages: number;
  selectedOrders: string[];
}

const initialOrdersState: OrdersState = {
  orders: [],
  isCreateOpen: false,
  isLoading: true,
  error: null,
  total: 0,
  totalPages: 0,
  selectedOrders: [],
};

type OrdersAction =
  | { type: 'SET_ORDERS'; orders: Order[] }
  | { type: 'SET_CREATE_OPEN'; open: boolean }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_PAGINATION'; total: number; totalPages: number }
  | { type: 'SET_SELECTED_ORDERS'; ids: string[] };

function ordersReducer(state: OrdersState, action: OrdersAction): OrdersState {
  switch (action.type) {
    case 'SET_ORDERS': return { ...state, orders: action.orders };
    case 'SET_CREATE_OPEN': return { ...state, isCreateOpen: action.open };
    case 'SET_LOADING': return { ...state, isLoading: action.loading };
    case 'SET_ERROR': return { ...state, error: action.error };
    case 'SET_PAGINATION': return { ...state, total: action.total, totalPages: action.totalPages };
    case 'SET_SELECTED_ORDERS': return { ...state, selectedOrders: action.ids };
    default: return state;
  }
}

export function useOrdersManager(searchParams: URLSearchParams) {
  const [state, dispatch] = useReducer(ordersReducer, initialOrdersState);
  const router = useRouter();
  const pathname = usePathname();

  const [filter, dispatchFilter] = useReducer(filterReducer, {
    page: Number(searchParams.get('page')) || 1,
    searchTerm: searchParams.get('search') || '',
    selectedStatus: searchParams.get('status') || 'all',
    userId: searchParams.get('userId') || '',
    limit: Number(searchParams.get('limit')) || 10,
    sortBy: '',
    sortDir: 'desc' as const,
  });

  const { showConfirm, showLoading, hideModal } = useModal();

  const fetchOrders = useCallback(async (showLoadingInState = true) => {
    if (showLoadingInState) dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const response = await ordersAPI.list(filter.page, filter.limit, {
        status: filter.selectedStatus !== 'all' ? filter.selectedStatus.toUpperCase() : undefined,
        search: filter.searchTerm || undefined,
        userId: filter.userId || undefined,
        sortBy: filter.sortBy || undefined,
        sortDir: filter.sortBy ? filter.sortDir : undefined,
      });

      let ordersData: BackendOrderData[] = [];
      let totalCount = 0;
      let metaTotalPages = 0;

      if (Array.isArray(response)) {
        ordersData = response;
        totalCount = response.length;
      } else if (response.success && response.data) {
        ordersData = response.data.data || response.data.orders || (Array.isArray(response.data) ? response.data : []);
        totalCount = response.data.meta?.total || response.data.total || response.total || ordersData.length;
        metaTotalPages = response.data.meta?.totalPages || response.data.totalPages || response.totalPages || Math.ceil(totalCount / filter.limit);
      } else if (response.data) {
        ordersData = Array.isArray(response.data) ? response.data : [];
        // response.meta holds pagination when commerce returns raw { data: [], meta: { total, totalPages } }
        totalCount = response.total || response.meta?.total || response.data.meta?.total || response.data.total || ordersData.length;
        metaTotalPages = response.totalPages || response.meta?.totalPages || response.data.meta?.totalPages || response.data.totalPages || Math.ceil(totalCount / filter.limit);
      }

      dispatch({ type: 'SET_ORDERS', orders: ordersData.map(mapBackendOrderToOrder) });
      dispatch({ type: 'SET_PAGINATION', total: totalCount, totalPages: metaTotalPages || Math.ceil(totalCount / filter.limit) || 1 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders';
      console.error('Failed to load orders:', err);
      dispatch({ type: 'SET_ERROR', error: msg });
      toast.error(msg);
    } finally {
      if (showLoadingInState) dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, [filter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (filter.page > 1) params.set('page', String(filter.page)); else params.delete('page');
      if (filter.searchTerm) params.set('search', filter.searchTerm); else params.delete('search');
      if (filter.selectedStatus !== 'all') params.set('status', filter.selectedStatus); else params.delete('status');
      if (filter.userId) params.set('userId', filter.userId); else params.delete('userId');
      if (filter.limit !== 10) params.set('limit', String(filter.limit)); else params.delete('limit');
      const query = params.toString();
      const newUrl = `${pathname}${query ? `?${query}` : ''}`;
      if (typeof window !== 'undefined' && window.location.search !== (query ? `?${query}` : '')) {
        window.history.replaceState(null, '', newUrl);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filter, pathname, searchParams]);

  useEffect(() => {
    dispatchFilter({ type: 'SET_FILTERS', filters: {
      page: Number(searchParams.get('page')) || 1,
      searchTerm: searchParams.get('search') || '',
      selectedStatus: searchParams.get('status') || 'all',
      userId: searchParams.get('userId') || '',
      limit: Number(searchParams.get('limit')) || 10,
    }});
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => { void fetchOrders(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleDeleteOrder = async (id: string) => {
    showConfirm({
      title: 'Delete Order',
      message: 'Are you sure?',
      type: 'danger',
      onConfirm: async () => {
        showLoading('Deleting...');
        try {
          await ordersAPI.delete(id);
          toast.success('Order deleted');
          await fetchOrders(false);
        } catch (err) {
          console.error('Failed to delete order:', err);
          toast.error('Failed to delete');
        } finally {
          hideModal();
        }
      },
    });
  };

  const handleBulkDelete = async () => {
    showConfirm({
      title: 'Delete Multiple',
      message: `Delete ${state.selectedOrders.length} orders?`,
      type: 'danger',
      onConfirm: async () => {
        showLoading('Deleting...');
        try {
          await ordersAPI.deleteBulk(state.selectedOrders);
          toast.success('Orders deleted');
          dispatch({ type: 'SET_SELECTED_ORDERS', ids: [] });
          await fetchOrders(false);
        } catch (err) {
          console.error('Failed to bulk delete orders:', err);
          toast.error('Failed to delete');
        } finally {
          hideModal();
        }
      },
    });
  };

  return {
    state,
    dispatch,
    filter,
    dispatchFilter,
    handleDeleteOrder,
    handleBulkDelete,
    fetchOrders,
    router,
  };
}
