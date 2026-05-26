'use client';

import { Button } from '@/components/ui/button';
import {
  Eye24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import { ClientDate } from '@/components/ClientDate';
import type { Order } from '@/lib/types';

interface StatusColors {
  [key: string]: string;
}

interface OrdersMobileViewProps {
  filteredOrders: Order[];
  statusColors: StatusColors;
  onView: (order: Order) => void;
  onDelete: (id: string) => void;
}

export function OrdersMobileView({
  filteredOrders,
  statusColors,
  onView,
  onDelete,
}: OrdersMobileViewProps) {
  return (
    <div className="block sm:hidden divide-y divide-border">
      {filteredOrders.map((order) => (
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
                onClick={() => onView(order)}
              >
                <Eye24Regular className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(order.id)}
              >
                <Delete24Regular className="size-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground" suppressHydrationWarning>
              {order.orderDate ? <ClientDate date={order.orderDate} /> : '—'}
            </span>
            <span className="font-semibold tabular-nums">
              ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </span>
            <span className="uppercase tracking-tight">
              <PaymentLabel order={order} />
            </span>
          </div>
        </div>
      ))}
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
