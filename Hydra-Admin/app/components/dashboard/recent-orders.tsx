'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClientDate } from '@/components/ClientDate';
import {
  Clock24Regular,
  CheckmarkCircle24Regular,
  VehicleTruck24Regular,
  DismissCircle24Regular,
  Payment24Regular,
  Box24Regular,
  ArrowUpRight24Regular,
} from '@fluentui/react-icons';
import type React from 'react';

interface OrderSummary {
  id: string;
  status: string;
  createdAt: string;
  total: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pendiente', color: '#f59e0b', icon: Clock24Regular },
  PAID: { label: 'Pagado', color: '#3b82f6', icon: Payment24Regular },
  PROCESSING: { label: 'Procesando', color: '#8b5cf6', icon: Box24Regular },
  SHIPPED: { label: 'Enviado', color: '#06b6d4', icon: VehicleTruck24Regular },
  COMPLETED: { label: 'Completado', color: '#10b981', icon: CheckmarkCircle24Regular },
  CANCELLED: { label: 'Cancelado', color: '#ef4444', icon: DismissCircle24Regular },
};

export function RecentOrders({ orders }: { orders: OrderSummary[] }) {
  return (
    <Card className="glass-card overflow-hidden border-none">
      <div className="bg-primary/[0.03] px-8 py-5 border-b border-primary/5 flex items-center justify-between group/header">
        <div className="flex items-center gap-4">
          <div className="relative size-8 shrink-0 flex items-center justify-center rounded-full bg-primary/[0.04] border border-primary/10 shadow-sm transition-transform duration-500 group-hover/header:scale-110 group-hover/header:border-primary/20 overflow-hidden">
            <Image
              src="/cat.png"
              alt="Hydra"
              width={18}
              height={18}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain opacity-70 group-hover/header:opacity-100 transition-opacity"
              unoptimized
            />
          </div>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/80 font-display">
            Pedidos Recientes
          </h3>
        </div>
        <Link
          href="/dashboard/orders"
          className="text-[10px] font-semibold uppercase tracking-widest text-primary hover:gap-2 flex items-center gap-1.5 transition-all"
        >
          Ver Todos <ArrowUpRight24Regular className="size-3" />
        </Link>
      </div>
      <CardContent className="p-0">
        {!orders.length ? (
          <p className="text-sm text-muted-foreground p-8 text-center italic">
            Sin pedidos recientes.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {orders.slice(0, 8).map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? {
                label: order.status,
                color: '#6b7280',
                icon: Clock24Regular,
              };
              const Icon = cfg.icon;
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center gap-4 px-8 py-6 hover:bg-primary/[0.02] transition-all duration-300 group"
                >
                  <div className="p-2.5 rounded-xl border border-primary/5 bg-primary/5 group-hover:scale-110 transition-transform">
                    <Icon className="size-4 shrink-0" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold tracking-tight tabular-nums font-display">
                      #{(order.id ?? '').slice(0, 8).toUpperCase()}
                    </p>
                    <p
                      className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider"
                      suppressHydrationWarning
                    >
<ClientDate
                         date={order.createdAt}
                         formatter={(d) => format(d, 'd MMM, yyyy', { locale: es })}
                       />
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-current/10"
                    style={{
                      backgroundColor: cfg.color + '10',
                      color: cfg.color,
                    }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-sm font-bold text-right min-w-[100px] tabular-nums font-display">
                    {(order.total ?? 0).toLocaleString('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    })}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
