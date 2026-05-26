'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Delete24Regular,
  ArrowDownload24Regular,
  Add24Regular,
  Warning24Regular,
  Box24Regular,
} from '@fluentui/react-icons';
import { CreateOrderDialog } from './create-order-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

import { OrdersFilters } from './components/orders-parts/OrdersFilters';
import { OrdersTable } from './components/orders-parts/OrdersTable';
import { OrdersMobileList } from './components/orders-parts/OrdersMobileList';
import { OrdersPagination } from './components/orders-parts/OrdersPagination';

import { useOrdersManager } from './hooks/useOrdersManager';

function OrdersContentInner() {
  const searchParams = useSearchParams();
  const {
    state,
    dispatch,
    filter,
    dispatchFilter,
    handleDeleteOrder,
    handleBulkDelete,
    fetchOrders,
    router,
  } = useOrdersManager(searchParams);

  const { orders, isCreateOpen, isLoading, error, total, totalPages, selectedOrders } = state;

  const handleSort = (col: string) => {
    const next = filter.sortBy === col && filter.sortDir === 'asc' ? 'desc' : 'asc';
    dispatchFilter({ type: 'SET_SORT', sortBy: col, sortDir: next });
  };

  return (
    <PageLayout>
      <PageHeader
        title="Orders"
        description="Manage customer orders and shipments"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => dispatch({ type: 'SET_CREATE_OPEN', open: true })}
              className="font-semibold shadow-sm"
            >
              <Add24Regular className="mr-1.5 size-4" />{' '}
              <span className="hidden sm:inline">Create Order</span>
              <span className="sm:hidden">Create</span>
            </Button>
            {selectedOrders.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="font-semibold"
              >
                <Delete24Regular className="mr-1.5 size-4" /> Delete ({selectedOrders.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
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
        onOpenChange={(open) => dispatch({ type: 'SET_CREATE_OPEN', open })}
        onOrderCreated={() => fetchOrders(true)}
      />

      <OrdersFilters
        searchTerm={filter.searchTerm}
        onSearchChange={(val) => dispatchFilter({ type: 'SET_SEARCH', search: val })}
        userId={filter.userId}
        onUserChange={(val) => dispatchFilter({ type: 'SET_USER_ID', userId: val })}
        selectedStatus={filter.selectedStatus}
        onStatusChange={(val) => dispatchFilter({ type: 'SET_STATUS', status: val })}
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">All Orders</CardTitle>
          <CardDescription className="font-medium text-muted-foreground/70">
            Showing{' '}
            <span className="text-foreground font-semibold tabular-nums">{orders.length}</span> of{' '}
            <span className="text-foreground font-semibold tabular-nums">{total}</span> orders
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
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="size-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Warning24Regular className="size-7 text-destructive" />
              </div>
              <h3 className="text-base font-semibold text-foreground/80 mb-1">Something went wrong</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={() => fetchOrders(true)}>
                Try again
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="size-14 rounded-full bg-primary/[0.04] flex items-center justify-center mb-4">
                <Box24Regular className="size-7 text-muted-foreground/40" />
              </div>
              <h3 className="text-base font-semibold text-foreground/80 mb-1">No orders found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No orders match your current filters. Try adjusting your search or status filter.
              </p>
            </div>
          ) : (
            <>
              <OrdersMobileList
                orders={orders}
                onViewOrder={(o) => router.push(`/dashboard/orders/${o.id}`)}
                onDeleteOrder={handleDeleteOrder}
              />
              <OrdersTable
                orders={orders}
                selectedOrders={selectedOrders}
                sortBy={filter.sortBy}
                sortDir={filter.sortDir}
                onSort={handleSort}
                onSelectOrder={(id) =>
                  dispatch({
                    type: 'SET_SELECTED_ORDERS',
                    ids: selectedOrders.includes(id)
                      ? selectedOrders.filter((x) => x !== id)
                      : [...selectedOrders, id],
                  })
                }
                onSelectAll={() =>
                  dispatch({
                    type: 'SET_SELECTED_ORDERS',
                    ids: selectedOrders.length === orders.length ? [] : orders.map((o) => o.id),
                  })
                }
                onViewOrder={(o) => router.push(`/dashboard/orders/${o.id}`)}
                onDeleteOrder={handleDeleteOrder}
              />
              <OrdersPagination
                currentPage={filter.page}
                totalPages={totalPages}
                limit={filter.limit}
                onPageChange={(p) => dispatchFilter({ type: 'SET_PAGE', page: p })}
                onLimitChange={(l) => dispatchFilter({ type: 'SET_LIMIT', limit: l })}
              />
            </>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}

export function OrdersContent() {
  return <OrdersContentInner />;
}
