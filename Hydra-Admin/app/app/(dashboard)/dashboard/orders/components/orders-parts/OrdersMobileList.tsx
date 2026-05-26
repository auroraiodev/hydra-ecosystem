'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye24Regular, Delete24Regular } from '@fluentui/react-icons';
import { ClientDate } from '@/components/ClientDate';
import type { Order } from '@/lib/types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

interface OrdersMobileListProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
}

export function OrdersMobileList({ orders, onViewOrder, onDeleteOrder }: OrdersMobileListProps) {
  return (
    <div className="block sm:hidden divide-y divide-border">
      {orders.map((order) => (
        <div key={order.id} className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{order.orderNumber}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[order.status] || ''}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{order.customer}</p>
              <p className="text-xs text-muted-foreground">{order.email}</p>
            </div>
            <div className="flex gap-1 ml-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onViewOrder(order)}
              >
                <Eye24Regular className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => onDeleteOrder(order.id)}
              >
                <Delete24Regular className="size-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground" suppressHydrationWarning>
              {order.orderDate ? <ClientDate date={order.orderDate} /> : '—'}
            </span>
            <span className="font-semibold">${order.total.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </span>
            <span className="uppercase">
              {order.paymentMethod === 'mercadopago' ? (
                <>
                  Mercado Pago
                  {order.paymentStatus === 'approved' && (
                    <span className="text-green-600 font-semibold"> (Aprobado)</span>
                  )}
                  {order.paymentStatus === 'pending' && (
                    <span className="text-yellow-600 font-semibold"> (Pendiente)</span>
                  )}
                  {(order.paymentStatus === 'rejected' || order.paymentStatus === 'cancelled') && (
                    <span className="text-red-600 font-semibold"> (Rechazado)</span>
                  )}
                </>
              ) : order.paymentMethod === 'wallet' ? (
                'Hydra Wallet'
              ) : (
                'Transfer'
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
