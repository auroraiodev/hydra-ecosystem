'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Payment24Regular } from '@fluentui/react-icons';
import type { Order } from '@/lib/types';

interface OrderCustomerCardProps {
  order: Order;
}

export function OrderCustomerCard({ order }: OrderCustomerCardProps) {
  return (
    <Card className="glass-card overflow-hidden border-none">
      <div className="bg-primary/[0.03] px-8 py-5 border-b border-primary/5">
        <div className="flex items-center gap-3">
          <Payment24Regular className="size-4 text-primary" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
            Cliente y Pago
          </h3>
        </div>
      </div>
      <CardContent className="p-8 space-y-6">
        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50">
              Cliente
            </p>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-text-body leading-none mb-1">
                {order.customer}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium truncate">
                {order.email}
              </p>
            </div>
          </div>
          <div className="h-px bg-border/40 w-full" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50">
                Método de Pago
              </p>
              <p className="text-xs font-bold text-text-body capitalize">
                {order.paymentMethod === 'mercadopago'
                  ? 'Mercado Pago'
                  : order.paymentMethod?.replace('_', ' ') || 'transfer'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50">
                Estado del Pago
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest
                  ${
                    order.paymentStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : order.paymentStatus === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }
                `}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
