'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ordersAPI, sellerAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft24Regular,
  SpinnerIos20Regular,
  CalendarLtr24Regular,
} from '@fluentui/react-icons';
import type { Order } from '@/lib/types';
import { toast } from 'sonner';
import { useModal } from '@/components/providers/modal-context';
import { AddItemModal } from '@/components/orders/add-item-modal';
import { OrderItemsCard } from './components/OrderItemsCard';
import { OrderTimelineCard } from './components/OrderTimelineCard';
import { OrderDetailsSidebar } from './components/OrderDetailsSidebar';
const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  processing: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  shipped: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  delivered: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
};

import { mapBackendOrderToOrder } from './utils/order-mapper';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { back } = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const loading = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const { showLoading, hideModal } = useModal();
  const autoCompletingRef = useRef(false);

  const loadOrder = useCallback(async () => {
    try {
      const response = await sellerAPI.getOrder(unwrappedParams.id);
      if (response) {
        const orderData = response.data || response;
        const mappedOrder = mapBackendOrderToOrder(orderData);
        setOrder(mappedOrder);
      } else {
        setError('Order not found');
      }
    } catch {
      setError('Failed to load order details');
    } finally {
      loading.current = false;
    }
  }, [unwrappedParams.id]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  // Stabilize dependencies by only looking at relevant fields
  const itemsStatusKey = order?.items
    .map((i) => `${i.id}:${i.deliveryStatus || (i.isDelivered ? 'sold' : 'pending')}`)
    .join('|');

  // Auto-complete the order when every non-cancelled item is delivered
  useEffect(() => {
    if (!order || autoCompletingRef.current) return;
    const status = order.status.toLowerCase();
    if (['completed', 'delivered', 'cancelled'].includes(status)) return;

    const activeItems = order.items.filter((i) => {
      const s = (i.deliveryStatus || (i.isDelivered ? 'sold' : 'pending')).toLowerCase();
      return s !== 'cancelled';
    });
    if (activeItems.length === 0) return;

    const allDelivered = activeItems.every((i) => {
      const s = (i.deliveryStatus || (i.isDelivered ? 'sold' : 'pending')).toLowerCase();
      return s === 'sold';
    });
    if (!allDelivered) return;

    // Handle then/catch/finally normally
    autoCompletingRef.current = true;
    ordersAPI
      .updateStatus(order.id, 'COMPLETED')
      .then(() => {
        toast.success('Orden completada — todos los artículos entregados.');
        void loadOrder();
      })
      .catch((err) => {
        console.error('Auto-completion error:', err);
        toast.error('Error al completar la orden automáticamente.');
      })
      .finally(() => {
        autoCompletingRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, order?.status, itemsStatusKey, loadOrder]);

  // Auto-mark local inventory items as sold when Mercado Pago payment is approved
  useEffect(() => {
    if (!order) return;
    if (order.paymentMethod !== 'mercadopago' || order.paymentStatus !== 'approved') return;

    const undeliveredLocalItems = order.items.filter(
      (item) => item.isLocalInventory && !item.isDelivered
    );
    if (undeliveredLocalItems.length === 0) return;

    const autoMarkSold = async () => {
      try {
        await Promise.all(
          undeliveredLocalItems.map((item) =>
            ordersAPI.updateItemDeliveryStatus(order.id, item.id, { isDelivered: true })
          )
        );
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((i) =>
                  i.isLocalInventory ? { ...i, isDelivered: true } : i
                ),
              }
            : null
        );
        toast.success(
          `${undeliveredLocalItems.length} artículo(s) marcado(s) como vendido automáticamente`
        );
      } catch {
        toast.error('Error al marcar artículos como vendidos automáticamente');
      }
    };
    void autoMarkSold();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, order?.paymentMethod, order?.paymentStatus, itemsStatusKey]);

  if (loading.current) {
    return (
      <div className="flex items-center justify-center h-full p-4 sm:p-8">
        <SpinnerIos20Regular className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-4 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => back()}>
            <ArrowLeft24Regular className="size-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Error</h1>
        </div>
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">{error || 'Order not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 sm:p-10 lg:p-14 space-y-10">
      {/* Refined Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex items-start gap-6">
          <Button
            variant="outline"
            size="icon"
            className="size-12 rounded-2xl shadow-playful border-primary/5 hover:bg-primary/5 transition-all"
            onClick={() => back()}
          >
            <ArrowLeft24Regular className="size-6 text-primary" />
          </Button>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-semibold tracking-tighter tabular-nums text-foreground">
                {order.orderNumber}
              </h1>
              <span
                className={`px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] border shadow-sm ${statusColors[order.status] || ''} border-current/10`}
              >
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground/50">
              <CalendarLtr24Regular className="size-4" />
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                suppressHydrationWarning
              >
                Registrada el{' '}
                {new Date(order.orderDate).toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Secondary actions can go here if needed */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <OrderItemsCard
            order={order}
            onOpenAddItem={() => setIsAddItemOpen(true)}
            onRefresh={() => void loadOrder()}
          />
          <OrderTimelineCard order={order} />
        </div>

        <div className="lg:col-span-4">
          <OrderDetailsSidebar order={order} onRefresh={() => void loadOrder()} />
        </div>
      </div>

      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onConfirm={async (data) => {
          showLoading('Adding item...');
          try {
            // Ensure order is not null
            if (!order) return;
            await ordersAPI.addItem(order.id, data);
            toast.success('Item added successfully');
            // Refresh order — balance check in OrderItemsCard fires on prop change
            const response = await sellerAPI.getOrder(unwrappedParams.id);
            if (response) {
              const orderData = response.data || response;
              const mappedOrder = mapBackendOrderToOrder(orderData);
              setOrder(mappedOrder);
            }
            setIsAddItemOpen(false);
          } catch {
            toast.error('Failed to add item');
          } finally {
            hideModal();
          }
        }}
      />
    </div>
  );
}
