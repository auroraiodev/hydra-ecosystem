'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye24Regular, Delete24Regular, ChevronUp24Regular, ChevronDown24Regular, ChevronUpDown24Regular } from '@fluentui/react-icons';
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

function SortIcon({ col, sortBy, sortDir }: { col: string; sortBy: string; sortDir: 'asc' | 'desc' }) {
  if (sortBy !== col) return <ChevronUpDown24Regular className="size-3.5 ml-1 opacity-40" />;
  return sortDir === 'asc'
    ? <ChevronUp24Regular className="size-3.5 ml-1" />
    : <ChevronDown24Regular className="size-3.5 ml-1" />;
}

interface OrdersTableProps {
  orders: Order[];
  selectedOrders: string[];
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
  onSelectOrder: (id: string) => void;
  onSelectAll: () => void;
  onViewOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
}

export function OrdersTable({
  orders,
  selectedOrders,
  sortBy,
  sortDir,
  onSort,
  onSelectOrder,
  onSelectAll,
  onViewOrder,
  onDeleteOrder,
}: OrdersTableProps) {
  const thSort = 'h-11 px-4 text-left align-middle font-semibold text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 cursor-pointer hover:bg-muted select-none';
  const thStatic = 'h-11 px-4 text-left align-middle font-semibold text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60';

  return (
    <div className="hidden sm:block relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className={thStatic + ' w-10'}>
              <input
                type="checkbox"
                className="rounded border-muted-foreground/30"
                checked={selectedOrders.length > 0 && selectedOrders.length === orders.length}
                onChange={onSelectAll}
              />
            </th>
            <th className={thStatic}>Order #</th>
            <th className={thSort} onClick={() => onSort('customer')}>
              <span className="flex items-center">Customer<SortIcon col="customer" sortBy={sortBy} sortDir={sortDir} /></span>
            </th>
            <th className={thSort} onClick={() => onSort('status')}>
              <span className="flex items-center">Status<SortIcon col="status" sortBy={sortBy} sortDir={sortDir} /></span>
            </th>
            <th className={thSort} onClick={() => onSort('date')}>
              <span className="flex items-center">Date<SortIcon col="date" sortBy={sortBy} sortDir={sortDir} /></span>
            </th>
            <th className="h-11 px-4 text-right align-middle font-semibold text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 cursor-pointer hover:bg-muted select-none" onClick={() => onSort('total')}>
              <span className="flex items-center justify-end">Total<SortIcon col="total" sortBy={sortBy} sortDir={sortDir} /></span>
            </th>
            <th className="h-11 px-4 text-right align-middle font-semibold text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className={`border-b hover:bg-muted/50 ${selectedOrders.includes(order.id) ? 'bg-muted' : ''}`}
            >
              <td className="p-4 align-middle">
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={() => onSelectOrder(order.id)}
                />
              </td>
              <td className="p-4 align-middle font-medium">
                {order.orderNumber}
                <div className="text-[10px] text-muted-foreground uppercase mt-1">
                  {order.paymentMethod === 'mercadopago' ? (
                    <>
                      Mercado Pago
                      {order.paymentStatus === 'approved' && <span className="text-green-600 font-semibold"> (Aprobado)</span>}
                      {order.paymentStatus === 'pending' && <span className="text-yellow-600 font-semibold"> (Pendiente)</span>}
                      {(order.paymentStatus === 'rejected' || order.paymentStatus === 'cancelled') && <span className="text-red-600 font-semibold"> (Rechazado)</span>}
                    </>
                  ) : order.paymentMethod === 'wallet' ? 'Hydra Wallet' : 'Transfer'}
                </div>
              </td>
              <td className="p-4 align-middle">
                <div>
                  <p className="font-medium">{order.customer}</p>
                  <p className="text-xs text-muted-foreground">{order.email}</p>
                </div>
              </td>
              <td className="p-4 align-middle">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || ''}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </td>
              <td className="p-4 align-middle">
                {order.orderDate ? (
                  <span className="tabular-nums font-medium text-muted-foreground/80">
                    <ClientDate date={order.orderDate} />
                  </span>
                ) : '—'}
              </td>
              <td className="p-4 align-middle text-right font-semibold tabular-nums text-primary/90">
                ${order.total.toFixed(2)}
              </td>
              <td className="p-4 align-middle text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onViewOrder(order)}>
                    <Eye24Regular className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDeleteOrder(order.id)}>
                    <Delete24Regular className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
