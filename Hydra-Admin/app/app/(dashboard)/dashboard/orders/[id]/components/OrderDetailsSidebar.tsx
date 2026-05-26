'use client';

import React, { useReducer, useEffect } from 'react';
import { toast } from 'sonner';
import { ordersAPI } from '@/lib/api';
import type { Order } from '@/lib/types';
import { useModal } from '@/components/providers/modal-context';
import { useRouter } from 'next/navigation';
import {
  OrderStatusCard,
  OrderLogisticsCard,
  OrderInternalLogCard,
  OrderCustomerCard,
} from './sidebar';

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

interface SidebarState {
  editStatus: string;
  isRequestingReview: boolean;
  isMarkingPaidLocal: boolean;
  isUndoing: boolean;
  isUpdatingDates: boolean;
  isUpdatingInternal: boolean;
  internalOrderNumber: string;
  trackingEntries: TrackingEntry[];
  newEntry: TrackingEntry;
  estimatedDeliveryAt: string;
  arrivedAt: string;
  deliveredAt: string;
  importOrderedAt: string;
}

type SidebarAction =
  | { type: 'SET_FIELD'; field: keyof SidebarState; value: unknown }
  | { type: 'SET_NEW_ENTRY'; entry: TrackingEntry }
  | { type: 'SYNC_ORDER'; order: Order }
  | { type: 'ADD_TRACKING_ENTRY' }
  | { type: 'REMOVE_TRACKING_ENTRY'; index: number };

function sidebarReducer(state: SidebarState, action: SidebarAction): SidebarState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_NEW_ENTRY':
      return { ...state, newEntry: action.entry };
    case 'SYNC_ORDER':
      return {
        ...state,
        editStatus: action.order.status,
        internalOrderNumber: action.order.internalOrderNumber || '',
        trackingEntries: action.order.trackingEntries || [],
        estimatedDeliveryAt: action.order.estimatedDeliveryAt
          ? new Date(action.order.estimatedDeliveryAt).toISOString().split('T')[0]
          : '',
        arrivedAt: action.order.arrivedAt ? new Date(action.order.arrivedAt).toISOString().split('T')[0] : '',
        deliveredAt: action.order.deliveredAt ? new Date(action.order.deliveredAt).toISOString().split('T')[0] : '',
        importOrderedAt: action.order.importOrderedAt
          ? new Date(action.order.importOrderedAt).toISOString().split('T')[0]
          : '',
      };
    case 'ADD_TRACKING_ENTRY':
      return {
        ...state,
        trackingEntries: [...state.trackingEntries, state.newEntry],
        newEntry: emptyEntry(),
      };
    case 'REMOVE_TRACKING_ENTRY':
      return {
        ...state,
        trackingEntries: state.trackingEntries.filter((_, i) => i !== action.index),
      };
    default:
      return state;
  }
}

const initialState: SidebarState = {
  editStatus: '',
  isRequestingReview: false,
  isMarkingPaidLocal: false,
  isUndoing: false,
  isUpdatingDates: false,
  isUpdatingInternal: false,
  internalOrderNumber: '',
  trackingEntries: [],
  newEntry: emptyEntry(),
  estimatedDeliveryAt: '',
  arrivedAt: '',
  deliveredAt: '',
  importOrderedAt: '',
};

export function OrderDetailsSidebar({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const { push } = useRouter();
  const { showLoading, hideModal } = useModal();
  const [state, dispatch] = useReducer(sidebarReducer, initialState);
  const {
    editStatus,
    isRequestingReview,
    isMarkingPaidLocal,
    isUndoing,
    isUpdatingDates,
    isUpdatingInternal,
    internalOrderNumber,
    trackingEntries,
    newEntry,
    estimatedDeliveryAt,
    arrivedAt,
    deliveredAt,
    importOrderedAt,
  } = state;

  const setField = (field: keyof SidebarState, value: unknown) =>
    dispatch({ type: 'SET_FIELD', field, value });

  useEffect(() => {
    dispatch({ type: 'SYNC_ORDER', order });
  }, [order]);

  const handleAddEntry = () => {
    if (!newEntry.date || !newEntry.event) {
      toast.error('Fecha y Evento son requeridos');
      return;
    }
    dispatch({ type: 'ADD_TRACKING_ENTRY' });
  };

  const handleRemoveEntry = (index: number) => {
    dispatch({ type: 'REMOVE_TRACKING_ENTRY', index });
  };

  const handleSaveInternal = async () => {
    setField('isUpdatingInternal', true);
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
      setField('isUpdatingInternal', false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    showLoading('Updating order status...');
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
    setField('isRequestingReview', true);
    try {
      await ordersAPI.requestReview(order.id);
      onRefresh();
      toast.success('Solicitud de reseña marcada con éxito');
    } catch {
      toast.error('Error al solicitar reseña');
    } finally {
      setField('isRequestingReview', false);
    }
  };

  const handleUpdateDates = async () => {
    setField('isUpdatingDates', true);
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
      setField('isUpdatingDates', false);
    }
  };

  const handleMarkPaidLocal = async () => {
    if (
      !confirm('¿Marcar esta orden como pagada localmente? Se eliminará la tarifa de importación.')
    )
      return;
    setField('isMarkingPaidLocal', true);
    showLoading('Marcando como pagado...');
    try {
      await ordersAPI.markPaidLocal(order.id);
      onRefresh();
      toast.success('Orden marcada como pagada (local) — tarifa de importación eliminada');
    } catch {
      toast.error('Error al marcar como pagado');
    } finally {
      setField('isMarkingPaidLocal', false);
      hideModal();
    }
  };

  const handleUndoToCart = async () => {
    if (!confirm('Are you sure you want to reopen this order to the cart?')) return;
    setField('isUndoing', true);
    showLoading('Reopening order...');
    try {
      await ordersAPI.undoToCart(order.id);
      toast.success('Order reopened successfully');
      push('/dashboard/orders');
    } catch {
      toast.error('Failed to reopen order');
    } finally {
      setField('isUndoing', false);
      hideModal();
    }
  };

  return (
    <div className="space-y-6">
      <OrderStatusCard
        order={order}
        editStatus={editStatus}
        isRequestingReview={isRequestingReview}
        isMarkingPaidLocal={isMarkingPaidLocal}
        isUndoing={isUndoing}
        statusColors={statusColors}
        onUpdateStatus={handleUpdateStatus}
        onRequestReview={handleRequestReview}
        onMarkPaidLocal={handleMarkPaidLocal}
        onUndoToCart={handleUndoToCart}
      />

      <OrderLogisticsCard
        order={order}
        importOrderedAt={importOrderedAt}
        arrivedAt={arrivedAt}
        estimatedDeliveryAt={estimatedDeliveryAt}
        isUpdatingDates={isUpdatingDates}
        onFieldChange={(field, value) => setField(field as keyof SidebarState, value)}
        onUpdateDates={handleUpdateDates}
      />

      <OrderInternalLogCard
        internalOrderNumber={internalOrderNumber}
        trackingEntries={trackingEntries}
        newEntry={newEntry}
        isUpdatingInternal={isUpdatingInternal}
        onFieldChange={(field, value) => setField(field as keyof SidebarState, value)}
        onNewEntryChange={(entry) => dispatch({ type: 'SET_NEW_ENTRY', entry })}
        onAddEntry={handleAddEntry}
        onRemoveEntry={handleRemoveEntry}
        onSaveInternal={handleSaveInternal}
      />

      <OrderCustomerCard order={order} />
    </div>
  );
}
