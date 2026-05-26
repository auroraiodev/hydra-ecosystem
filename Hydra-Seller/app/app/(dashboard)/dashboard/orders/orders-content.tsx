'use client';

import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import {
  Search24Regular,
  Delete24Regular,
  ArrowDownload24Regular,
  Add24Regular,
} from '@fluentui/react-icons';
import { ordersAPI, sellerAPI } from '@/lib/api';
import { toast } from 'sonner';
import type { Order, OrderItem } from '@/lib/types';
import { CreateOrderDialog } from './create-order-dialog';
import { useModal } from '@/components/providers/modal-context';
import { PageHeader } from '@/components/ui/page-header';
import { OrdersMobileView } from './components/OrdersMobileView';
import { OrdersDesktopTable } from './components/OrdersDesktopTable';
import { OrdersPagination } from './components/OrdersPagination';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  processing: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  shipped: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBackendOrderToOrder(backendOrder: any): Order {
  const user =
    backendOrder.userId || backendOrder.user_id || backendOrder.users
      ? {
          id:
            backendOrder.userId ||
            backendOrder.user_id ||
            backendOrder.users?.id ||
            backendOrder.users?._id,
          email: backendOrder.users?.email || backendOrder.user_email || '',
          name: (() => {
            const u = backendOrder.users;
            if (!u) return 'Usuario';
            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
            return fullName || u.username || u.email || 'Usuario';
          })(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          role: (backendOrder.users?.role || 'user') as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: (backendOrder.users?.isActive !== false ? 'active' : 'inactive') as any,
          joinDate: backendOrder.users?.created_at || new Date().toISOString(),
        }
      : undefined;

  return {
    id: backendOrder.id || backendOrder._id,
    orderNumber:
      backendOrder.order_number ||
      backendOrder.orderNumber ||
      `ORD-${(backendOrder.id || backendOrder._id).slice(-6).toUpperCase()}`,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (backendOrder.order_items || []).map((item: any) => {
      const product = item.products || item.product;
      return {
        productId: item.product_id || item.productId,
        productName: product?.name || product?.title || item.name || item.productName || '',
        quantity: item.quantity || 1,
        price:
          typeof item.unit_price === 'number'
            ? item.unit_price
            : typeof item.price === 'number'
              ? item.price
              : 0,
        unitPrice:
          typeof item.unit_price === 'number'
            ? item.unit_price
            : typeof item.price === 'number'
              ? item.price
              : 0,
        totalPrice:
          typeof item.total_price === 'number'
            ? item.total_price
            : (typeof item.unit_price === 'number'
                ? item.unit_price
                : typeof item.price === 'number'
                  ? item.price
                  : 0) * (item.quantity || 1),
        product: product
          ? {
              id: product.id || product._id,
              name: product.name || product.title || '',
              cardSet: product.expansion || product.set_name || '',
              rarity: product.rarities?.name || 'rare',
              price: typeof product.price === 'number' ? product.price : 0,
              stock: product.in_stock || product.inStock || 0,
              condition:
                product.conditions?.display_name ||
                product.conditions?.name ||
                product.condition ||
                'near-mint',
            }
          : undefined,
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

export function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { push } = useRouter();

  type FilterState = {
    searchTerm: string;
    selectedStatus: string;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    sortBy: string;
    sortDir: 'asc' | 'desc';
  };
  const [filterState, dispatchFilter] = useReducer(
    (s: FilterState, a: Partial<FilterState>): FilterState => ({ ...s, ...a }),
    { searchTerm: '', selectedStatus: 'all', page: 1, limit: 10, total: 0, totalPages: 0, sortBy: '', sortDir: 'desc' }
  );
  const { searchTerm, selectedStatus, page, limit, total, totalPages, sortBy, sortDir } = filterState;

  type UiState = {
    isCreateOpen: boolean;
    isLoading: boolean;
    error: string | null;
    selectedOrders: string[];
  };
  const [uiState, dispatchUi] = useReducer(
    (s: UiState, a: Partial<UiState>): UiState => ({ ...s, ...a }),
    { isCreateOpen: false, isLoading: true, error: null, selectedOrders: [] }
  );
  const { isCreateOpen, isLoading, error, selectedOrders } = uiState;

  const { showConfirm, showLoading, hideModal } = useModal();

  const fetchOrders = useCallback(
    async (showLoading = true) => {
      if (showLoading) dispatchUi({ isLoading: true });
      dispatchUi({ error: null });
      try {
        const response = await sellerAPI.getOrders(page, limit, {
          status: selectedStatus !== 'all' ? selectedStatus.toUpperCase() : undefined,
          search: searchTerm || undefined,
          sortBy: sortBy || undefined,
          sortDir: sortBy ? sortDir : undefined,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let ordersData: any[] = [];
        let totalCount = 0;
        let metaTotalPages = 0;

        if (Array.isArray(response)) {
          ordersData = response;
          totalCount = response.length;
        } else if (response.success && response.data) {
          ordersData =
            response.data.data ||
            response.data.orders ||
            (Array.isArray(response.data) ? response.data : []);
          totalCount =
            response.data.meta?.total || response.data.total || response.total || ordersData.length;
          metaTotalPages =
            response.data.meta?.totalPages ||
            response.data.totalPages ||
            response.totalPages ||
            Math.ceil(totalCount / limit);
        } else if (response.data) {
          ordersData = Array.isArray(response.data) ? response.data : [];
          totalCount =
            response.total || response.data.meta?.total || response.data.total || ordersData.length;
          metaTotalPages =
            response.totalPages ||
            response.data.meta?.totalPages ||
            response.data.totalPages ||
            Math.ceil(totalCount / limit);
        }

        setOrders(ordersData.map(mapBackendOrderToOrder));
        dispatchFilter({ total: totalCount, totalPages: metaTotalPages || Math.ceil(totalCount / limit) || 1 });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
        dispatchUi({ error: errorMessage });
        toast.error(errorMessage);
      } finally {
        if (showLoading) dispatchUi({ isLoading: false });
      }
    },
    [page, limit, selectedStatus, searchTerm, sortBy, sortDir]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => orders, [orders]);

  const handleSelectOrder = (orderId: string) => {
    dispatchUi({
      selectedOrders: selectedOrders.includes(orderId)
        ? selectedOrders.filter((id) => id !== orderId)
        : [...selectedOrders, orderId],
    });
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      dispatchUi({ selectedOrders: [] });
    } else {
      dispatchUi({ selectedOrders: filteredOrders.map((o) => o.id) });
    }
  };

  const handleViewOrder = (order: Order) => {
    push(`/dashboard/orders/${order.id}`);
  };

  const handleDeleteOrder = async (id: string) => {
    showConfirm({
      title: 'Delete Order',
      message: 'Are you sure you want to delete this order? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        showLoading('Deleting order…');
        try {
          await ordersAPI.delete(id);
          toast.success('Order deleted');

          await fetchOrders(false);
        } catch {
          toast.error('Failed to delete order');
        } finally {
          hideModal();
        }
      },
    });
  };

  const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
    try {
      const response = await ordersAPI.export(format, { search: searchTerm });
      if (response.success) {
        window.open(response.url, '_blank');
        toast.success(`Exported as ${format.toUpperCase()}`);
      }
    } catch {
      toast.error('Export failed');
    }
  };

  const handleSort = (col: string) => {
    const next = sortBy === col && sortDir === 'asc' ? 'desc' : 'asc';
    dispatchFilter({ sortBy: col, sortDir: next, page: 1 });
  };

  const handleBulkDelete = async () => {
    showConfirm({
      title: 'Delete Multiple Orders',
      message: `Are you sure you want to delete ${selectedOrders.length} orders? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        showLoading(`Deleting ${selectedOrders.length} orders…`);
        try {
          await ordersAPI.deleteBulk(selectedOrders);
          toast.success('Orders deleted');
          dispatchUi({ selectedOrders: [] });
          await fetchOrders(false);
        } catch {
          toast.error('Failed to delete orders');
        } finally {
          hideModal();
        }
      },
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
      <PageHeader
        title="Orders"
        description="Manage your customer orders and shipments"
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => dispatchUi({ isCreateOpen: true })} className="font-bold shadow-sm">
              <Add24Regular className="mr-1.5 size-4" />{' '}
              <span className="hidden sm:inline">Create Order</span>
              <span className="sm:hidden">Create</span>
            </Button>
            {selectedOrders.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="font-bold"
              >
                <Delete24Regular className="mr-1.5 size-4" /> Delete ({selectedOrders.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              className="font-semibold"
            >
              <ArrowDownload24Regular className="mr-1.5 size-4" />{' '}
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        }
      />

      <CreateOrderDialog
        open={isCreateOpen}
        onOpenChange={(_, data) => dispatchUi({ isCreateOpen: data.open })}
        onOrderCreated={() => fetchOrders(true)}
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by order #, customer or email…"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => dispatchFilter({ searchTerm: e.target.value })}
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => {
            dispatchFilter({ selectedStatus: e.target.value, page: 1 });
          }}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm w-full sm:min-w-[150px]"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagado</option>
          <option value="processing">Procesando</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold tracking-tight">All Orders</CardTitle>
          <CardDescription className="font-medium text-muted-foreground/70">
            Showing{' '}
            <span className="text-foreground font-bold tabular-nums">{filteredOrders.length}</span>{' '}
            of <span className="text-foreground font-bold tabular-nums">{total}</span> orders
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b last:border-b-0">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-4 w-24 hidden sm:block" />
                  <Skeleton className="h-4 w-20 hidden md:block" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="size-8 rounded-md" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">{error}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No orders found</div>
          ) : (
            <>
              <OrdersMobileView
                filteredOrders={filteredOrders}
                statusColors={statusColors}
                onView={handleViewOrder}
                onDelete={handleDeleteOrder}
              />

              <OrdersDesktopTable
                filteredOrders={filteredOrders}
                selectedOrders={selectedOrders}
                statusColors={statusColors}
                onSelectOrder={handleSelectOrder}
                onSelectAll={handleSelectAll}
                onView={handleViewOrder}
                onDelete={handleDeleteOrder}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={handleSort}
              />

              <OrdersPagination
                page={page}
                totalPages={totalPages}
                limit={limit}
                onPageChange={(p) => dispatchFilter({ page: p })}
                onLimitChange={(l) => { dispatchFilter({ limit: l, page: 1 }); }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
