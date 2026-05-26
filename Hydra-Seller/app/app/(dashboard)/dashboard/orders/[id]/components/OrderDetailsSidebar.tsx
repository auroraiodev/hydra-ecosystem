'use client';

import React, { useEffect, useCallback, useReducer } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { People24Regular } from '@fluentui/react-icons';
import { toast } from 'sonner';
import { ordersAPI } from '@/lib/api';
import type { Order } from '@/lib/types';
import { useModal } from '@/components/providers/modal-context';
import { useRouter } from 'next/navigation';
import { OrderTrackingSection } from './OrderTrackingSection';
import { OrderStatusActions } from './OrderStatusActions';
import { OrderLogisticsDates } from './OrderLogisticsDates';
import { OrderPaymentSection } from './OrderPaymentSection';

type TrackingEntry = { date: string; time: string; origin: string; event: string };

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const emptyEntry = (): TrackingEntry => ({ date: '', time: '', origin: '', event: '' });

interface LoadingState {
  requestingReview: boolean;
  markingPaidLocal: boolean;
  undoing: boolean;
  updatingDates: boolean;
  updatingInternal: boolean;
}

export function OrderDetailsSidebar({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const { push } = useRouter();
  const { showLoading, hideModal } = useModal();
  const editStatus = order.status;
  const [loadingFlags, setLoadingFlags] = useReducer(
    (s: LoadingState, a: Partial<LoadingState>): LoadingState => ({ ...s, ...a }),
    { requestingReview: false, markingPaidLocal: false, undoing: false, updatingDates: false, updatingInternal: false }
  );
  const { requestingReview: isRequestingReview, markingPaidLocal: isMarkingPaidLocal, undoing: isUndoing, updatingDates: isUpdatingDates, updatingInternal: isUpdatingInternal } = loadingFlags;

  type OrderFields = {
    estimatedDeliveryAt: string;
    arrivedAt: string;
    deliveredAt: string;
    importOrderedAt: string;
    internalOrderNumber: string;
    trackingEntries: TrackingEntry[];
  };

  const toDateStr = (val: string | undefined | null) =>
    val ? new Date(val).toISOString().split('T')[0] : '';

  const [orderFields, dispatchOrderFields] = useReducer(
    (s: OrderFields, a: Partial<OrderFields>): OrderFields => ({ ...s, ...a }),
    {
      estimatedDeliveryAt: toDateStr(order.estimatedDeliveryAt),
      arrivedAt: toDateStr(order.arrivedAt),
      deliveredAt: toDateStr(order.deliveredAt),
      importOrderedAt: toDateStr(order.importOrderedAt),
      internalOrderNumber: order.internalOrderNumber || '',
      trackingEntries: order.trackingEntries || [],
    }
  );
  const {
    estimatedDeliveryAt,
    arrivedAt,
    deliveredAt,
    importOrderedAt,
    internalOrderNumber,
    trackingEntries,
  } = orderFields;

  const [newEntry, setNewEntry] = React.useState<TrackingEntry>(() => emptyEntry());

  useEffect(() => {
    dispatchOrderFields({
      estimatedDeliveryAt: toDateStr(order.estimatedDeliveryAt),
      arrivedAt: toDateStr(order.arrivedAt),
      deliveredAt: toDateStr(order.deliveredAt),
      importOrderedAt: toDateStr(order.importOrderedAt),
      internalOrderNumber: order.internalOrderNumber || '',
      trackingEntries: order.trackingEntries || [],
    });
  }, [order]);

  const handleAddEntry = useCallback(() => {
    if (!newEntry.date || !newEntry.event) {
      toast.error('Fecha y Evento son requeridos');
      return;
    }
    dispatchOrderFields({ trackingEntries: [...trackingEntries, newEntry] });
    setNewEntry(emptyEntry());
  }, [newEntry, trackingEntries]);

  const handleRemoveEntry = useCallback(
    (index: number) => {
      dispatchOrderFields({ trackingEntries: trackingEntries.filter((_, i) => i !== index) });
    },
    [trackingEntries]
  );

  const handleSaveInternal = async () => {
    setLoadingFlags({ updatingInternal: true });
    try {
      await ordersAPI.update(order.id, {
        internalOrderNumber: internalOrderNumber || null,
        trackingEntries,
      });
      onRefresh();
      toast.success('Información interna guardada');
    } catch {
      toast.error('Error al guardar la información interna');
    } finally {
      setLoadingFlags({ updatingInternal: false });
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    showLoading('Updating order status…');
    try {
      let apiStatus = newStatus.toUpperCase();
      if (newStatus === 'delivered') apiStatus = 'COMPLETED';

      await ordersAPI.updateStatus(order.id, apiStatus);

      if (apiStatus === 'COMPLETED') {
        const undeliveredItems = order.items.filter(
          (item) => item.deliveryStatus !== 'sold' && !item.isDelivered
        );
        if (undeliveredItems.length > 0) {
          await Promise.all(
            undeliveredItems.map((item) =>
              ordersAPI.updateItemDeliveryStatus(order.id, item.id, { status: 'sold' })
            )
          );
        }
      }

      onRefresh();
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      hideModal();
    }
  };

  const handleRequestReview = async () => {
    setLoadingFlags({ requestingReview: true });
    try {
      await ordersAPI.requestReview(order.id);
      onRefresh();
      toast.success('Solicitud de reseña marcada con éxito');
    } catch {
      toast.error('Error al solicitar reseña');
    } finally {
      setLoadingFlags({ requestingReview: false });
    }
  };

  const handleUpdateDates = async () => {
    setLoadingFlags({ updatingDates: true });
    try {
      await ordersAPI.update(order.id, {
        estimatedDeliveryAt: estimatedDeliveryAt || null,
        arrivedAt: arrivedAt || null,
        deliveredAt: deliveredAt || null,
        importOrderedAt: importOrderedAt || null,
      });
      onRefresh();
      toast.success('Fechas de entrega actualizadas');
    } catch {
      toast.error('Fallo al actualizar las fechas');
    } finally {
      setLoadingFlags({ updatingDates: false });
    }
  };

  const handleMarkPaidLocal = async () => {
    if (
      !confirm('¿Marcar esta orden como pagada localmente? Se eliminará la tarifa de importación.')
    )
      return;
    setLoadingFlags({ markingPaidLocal: true });
    showLoading('Marcando como pagado…');
    try {
      await ordersAPI.markPaidLocal(order.id);
      onRefresh();
      toast.success('Orden marcada como pagada (local) — tarifa de importación eliminada');
    } catch {
      toast.error('Error al marcar como pagado');
    } finally {
      setLoadingFlags({ markingPaidLocal: false });
      hideModal();
    }
  };

  const handleUndoToCart = async () => {
    if (!confirm('Are you sure you want to reopen this order to the cart?')) return;
    setLoadingFlags({ undoing: true });
    showLoading('Reopening order…');
    try {
      await ordersAPI.undoToCart(order.id);
      toast.success('Order reopened successfully');
      push('/dashboard/orders');
    } catch {
      toast.error('Failed to reopen order');
    } finally {
      setLoadingFlags({ undoing: false });
      hideModal();
    }
  };

  return (
    <div className="space-y-6">
      <OrderTrackingSection
        internalOrderNumber={internalOrderNumber}
        trackingEntries={trackingEntries}
        newEntry={newEntry}
        isUpdatingInternal={isUpdatingInternal}
        onInternalOrderNumberChange={(value) => dispatchOrderFields({ internalOrderNumber: value })}
        onNewEntryChange={setNewEntry}
        onAddEntry={handleAddEntry}
        onRemoveEntry={handleRemoveEntry}
        onSave={handleSaveInternal}
      />

      <OrderStatusActions
        editStatus={editStatus}
        statusColors={statusColors}
        reviewRequested={order.reviewRequested}
        paymentMethod={order.paymentMethod}
        orderStatus={order.status}
        isRequestingReview={isRequestingReview}
        isUndoing={isUndoing}
        onStatusChange={handleUpdateStatus}
        onRequestReview={handleRequestReview}
        onUndoToCart={handleUndoToCart}
      />

      <OrderLogisticsDates
        importOrderedAt={importOrderedAt}
        arrivedAt={arrivedAt}
        estimatedDeliveryAt={estimatedDeliveryAt}
        deliveredAt={deliveredAt}
        isUpdatingDates={isUpdatingDates}
        hasImportItems={order.items.some((i) => !i.isLocalInventory)}
        onImportOrderedAtChange={(value) => dispatchOrderFields({ importOrderedAt: value })}
        onArrivedAtChange={(value) => dispatchOrderFields({ arrivedAt: value })}
        onEstimatedDeliveryAtChange={(value) => dispatchOrderFields({ estimatedDeliveryAt: value })}
        onDeliveredAtChange={(value) => dispatchOrderFields({ deliveredAt: value })}
        onSave={handleUpdateDates}
      />

      {/* Cliente Details */}
      <Card className="glass-card overflow-hidden border-none">
        <div className="bg-primary/[0.03] px-8 py-5 border-b border-primary/5">
          <div className="flex items-center gap-3">
            <People24Regular className="size-4 text-primary" />
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
              Detalles del Cliente
            </h3>
          </div>
        </div>
        <CardContent className="p-8 space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{order.customer}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{order.email}</p>
          </div>
        </CardContent>
      </Card>

      <OrderPaymentSection
        paymentMethod={order.paymentMethod}
        paymentStatus={order.paymentStatus}
        isMarkingPaidLocal={isMarkingPaidLocal}
        onMarkPaidLocal={handleMarkPaidLocal}
      />
    </div>
  );
}
