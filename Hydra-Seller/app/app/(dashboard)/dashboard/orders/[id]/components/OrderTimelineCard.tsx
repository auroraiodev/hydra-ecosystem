import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  History24Regular,
  CheckmarkCircle24Regular,
  ShoppingBag24Regular,
  Airplane24Regular,
  VehicleTruck24Regular,
  Box24Regular,
  CalendarLtr24Regular,
} from '@fluentui/react-icons';
import type { Order } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ClientDate } from '@/components/ClientDate';

export function OrderTimelineCard({ order }: { order: Order }) {
  return (
    <Card className="glass-card overflow-hidden border-none">
      <div className="bg-primary/[0.03] px-8 py-6 border-b border-primary/5">
        <div className="flex items-center gap-3">
          <History24Regular className="size-5 text-primary" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
            Línea de Tiempo del Pedido
          </h2>
        </div>
      </div>
      <CardContent className="p-10">
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[19px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-primary/10 before:to-transparent">
          {/* 1. Order Created */}
          <div className="relative flex items-start gap-6 group is-active">
            <div className="flex items-center justify-center size-10 rounded-full border-4 border-background bg-green-500 text-white shadow-sm shrink-0 z-10 transition-transform group-hover:scale-110">
              <CheckmarkCircle24Regular className="size-5" />
            </div>
            <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-primary/5 transition-all hover:bg-muted/50">
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-bold text-sm tracking-tight">Pedido Creado</div>
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                  <CalendarLtr24Regular className="size-3" />
<span className="tabular-nums">
                     <ClientDate date={order.orderDate} />
                   </span>
                </div>
              </div>
              <div className="text-muted-foreground/80 text-xs font-medium">
                El pedido fue registrado en el sistema.
              </div>
            </div>
          </div>

          {/* 2. Payment */}
          <div
            className={cn(
              'relative flex items-start gap-6 group',
              ['paid', 'processing', 'shipped', 'delivered'].includes(order.status)
                ? 'is-active'
                : ''
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center size-10 rounded-full border-4 border-background shadow-sm shrink-0 z-10 transition-transform group-hover:scale-110',
                ['paid', 'processing', 'shipped', 'delivered'].includes(order.status)
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground/30'
              )}
            >
              {['paid', 'processing', 'shipped', 'delivered'].includes(order.status) ? (
                <CheckmarkCircle24Regular className="size-5" />
              ) : (
                <History24Regular className="size-5" />
              )}
            </div>
            <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-primary/5 transition-all hover:bg-muted/50">
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-bold text-sm tracking-tight">Pago Confirmado</div>
                <div
                  className={cn(
                    'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                    order.paymentStatus === 'approved'
                      ? 'text-green-600 bg-green-50 border-green-100'
                      : 'text-amber-600 bg-amber-50 border-amber-100'
                  )}
                >
                  {order.paymentStatus === 'approved' ? 'Confirmado' : 'Pendiente'}
                </div>
              </div>
              <div className="text-muted-foreground/80 text-xs font-medium">
                Validación del pago por administración.
              </div>
            </div>
          </div>

          {/* 3. Import Ordered (only for Importation orders) */}
          {order.items.some((i) => !i.isLocalInventory) && (
            <div
              className={cn(
                'relative flex items-start gap-6 group',
                order.importOrderedAt ? 'is-active' : ''
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center size-10 rounded-full border-4 border-background shadow-sm shrink-0 z-10 transition-transform group-hover:scale-110',
                  order.importOrderedAt
                    ? 'bg-orange-500 text-white'
                    : 'bg-muted text-muted-foreground/30'
                )}
              >
                <ShoppingBag24Regular
                  className={cn('size-5', !order.importOrderedAt && 'opacity-50')}
                />
              </div>
              <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-primary/5 transition-all hover:bg-muted/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-bold text-sm tracking-tight">Pedido a Importation</div>
                  <div
                    className={cn(
                      'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                      order.importOrderedAt
                        ? 'text-orange-600 bg-orange-50 border-orange-100'
                        : 'text-muted-foreground/40 bg-muted border-transparent'
                    )}
                  >
                    {order.importOrderedAt ? (
<span className="tabular-nums">
                       <ClientDate date={order.importOrderedAt} />
                     </span>
                    ) : (
                      'Pendiente'
                    )}
                  </div>
                </div>
                <div className="text-muted-foreground/80 text-xs font-medium">
                  Fecha en que se realizó el pedido de importación.
                </div>
              </div>
            </div>
          )}

          {/* 4. Arrival to Mexico */}
          <div
            className={cn(
              'relative flex items-start gap-6 group',
              order.arrivedAt ? 'is-active' : ''
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center size-10 rounded-full border-4 border-background shadow-sm shrink-0 z-10 transition-transform group-hover:scale-110',
                order.arrivedAt ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground/30'
              )}
            >
              <Airplane24Regular className={cn('size-5', !order.arrivedAt && 'opacity-50')} />
            </div>
            <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-primary/5 transition-all hover:bg-muted/50">
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-bold text-sm tracking-tight">Llegada a México</div>
                <div
                  className={cn(
                    'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                    order.arrivedAt
                      ? 'text-blue-600 bg-blue-50 border-blue-100'
                      : 'text-muted-foreground/40 bg-muted border-transparent'
                  )}
                >
                  {order.arrivedAt ? (
<span className="tabular-nums">
                       <ClientDate date={order.arrivedAt} />
                     </span>
                  ) : (
                    'En cálculo'
                  )}
                </div>
              </div>
              <div className="text-muted-foreground/80 text-xs font-medium">
                El producto ingresó a almacén nacional.
              </div>
            </div>
          </div>

          <div
            className={cn(
              'relative flex items-start gap-6 group',
              order.deliveredAt ? 'is-active' : ''
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center size-10 rounded-full border-4 border-background shadow-sm shrink-0 z-10 transition-transform group-hover:scale-110',
                order.deliveredAt ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground/30'
              )}
            >
              {order.deliveredAt ? (
                <Box24Regular className="size-5" />
              ) : (
                <VehicleTruck24Regular
                  className={cn('size-5', !order.deliveredAt && 'opacity-50')}
                />
              )}
            </div>
            <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-primary/5 transition-all hover:bg-muted/50">
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-bold text-sm tracking-tight">
                  {order.status === 'delivered' ? 'Entregado' : 'Entrega Estimada'}
                </div>
                <div
                  className={cn(
                    'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                    order.deliveredAt || order.estimatedDeliveryAt
                      ? 'text-green-600 bg-green-50 border-green-100'
                      : 'text-muted-foreground/40 bg-muted border-transparent'
                  )}
                >
<span className="tabular-nums">
                     {order.deliveredAt ? (
                       <ClientDate date={order.deliveredAt} />
                     ) : order.estimatedDeliveryAt ? (
                       <ClientDate date={order.estimatedDeliveryAt} />
                     ) : (
                       'En cálculo'
                     )}
                   </span>
                </div>
              </div>
              <div className="text-muted-foreground/80 text-xs font-medium">
                Fecha final de recepción del cliente.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
