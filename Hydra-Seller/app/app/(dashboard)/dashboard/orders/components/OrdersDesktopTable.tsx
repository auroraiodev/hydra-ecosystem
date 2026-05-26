'use client';

import { Button } from '@/components/ui/button';
import {
  Eye24Regular,
  Delete24Regular,
  ChevronUp24Regular,
  ChevronDown24Regular,
  ChevronUpDown24Regular,
} from '@fluentui/react-icons';
import { ClientDate } from '@/components/ClientDate';
import type { Order } from '@/lib/types';

interface StatusColors {
  [key: string]: string;
}

interface OrdersDesktopTableProps {
  filteredOrders: Order[];
  selectedOrders: string[];
  statusColors: StatusColors;
  onSelectOrder: (id: string) => void;
  onSelectAll: () => void;
  onView: (order: Order) => void;
  onDelete: (id: string) => void;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
}

function SortIcon({ col, sortBy, sortDir }: { col: string; sortBy: string; sortDir: 'asc' | 'desc' }) {
  if (sortBy !== col) return <ChevronUpDown24Regular className="size-3 ml-1 opacity-40" />;
  return sortDir === 'asc'
    ? <ChevronUp24Regular className="size-3 ml-1" />
    : <ChevronDown24Regular className="size-3 ml-1" />;
}

export function OrdersDesktopTable({
  filteredOrders,
  selectedOrders,
  statusColors,
  onSelectOrder,
  onSelectAll,
  onView,
  onDelete,
  sortBy,
  sortDir,
  onSort,
}: OrdersDesktopTableProps) {
  const thBase = 'h-11 px-4 text-left align-middle font-black text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60';
  const thSort = `${thBase} cursor-pointer hover:bg-muted select-none`;

  return (
    <div className="hidden sm:block relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className={`${thBase} w-10`}>
              <input
                type="checkbox"
                className="rounded border-muted-foreground/30"
                checked={selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                onChange={onSelectAll}
              />
            </th>
            <th className={thBase}>Order #</th>
            <th className={thSort} onClick={() => onSort('customer')}>
              <span className="flex items-center">Customer<SortIcon col="customer" sortBy={sortBy} sortDir={sortDir} /></span>
            </th>
            <th className={thSort} onClick={() => onSort('status')}>
              <span className="flex items-center">Status<SortIcon col="status" sortBy={sortBy} sortDir={sortDir} /></span>
            </th>
            <th className={thSort} onClick={() => onSort('date')}>
              <span className="flex items-center">Date<SortIcon col="date" sortBy={sortBy} sortDir={sortDir} /></span>
            </th>
            <th className={`${thSort} text-right`} onClick={() => onSort('total')}>
              <span className="flex items-center justify-end">Total<SortIcon col="total" sortBy={sortBy} sortDir={sortDir} /></span>
            </th>
            <th className={`${thBase} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order) => (
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
                <div className="text-[10px] text-muted-foreground uppercase mt-1 tracking-tight">
                  <PaymentLabel order={order} />
                </div>
              </td>
              <td className="p-4 align-middle">
                <div>
                  <p className="font-medium">{order.customer}</p>
                  <p className="text-xs text-muted-foreground">{order.email}</p>
                </div>
              </td>
              <td className="p-4 align-middle">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || ''}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </td>
              <td className="p-4 align-middle">
                {order.orderDate ? (
                  <span
                    className="tabular-nums font-medium text-muted-foreground/80"
                    suppressHydrationWarning
                  >
                    <ClientDate date={order.orderDate} />
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="p-4 align-middle text-right font-black tabular-nums text-primary/90">
                ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="p-4 align-middle text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onView(order)}>
                    <Eye24Regular className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => onDelete(order.id)}
                  >
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

function PaymentLabel({ order }: { order: Order }) {
  if (order.paymentMethod === 'mercadopago') {
    return (
      <>
        Mercado Pago
        {order.paymentStatus === 'approved' && (
          <span className="text-teal-600 font-semibold"> (Aprobado)</span>
        )}
        {order.paymentStatus === 'pending' && (
          <span className="text-amber-600 font-semibold"> (Pendiente)</span>
        )}
        {(order.paymentStatus === 'rejected' || order.paymentStatus === 'cancelled') && (
          <span className="text-rose-600 font-semibold"> (Rechazado)</span>
        )}
      </>
    );
  }
  return order.paymentMethod === 'wallet' ? 'Hydra Wallet' : 'Transfer';
}
