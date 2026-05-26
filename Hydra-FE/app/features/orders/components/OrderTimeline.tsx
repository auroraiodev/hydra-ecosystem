'use client';

import {
  CheckCircle2,
  Plane,
  Package,
  Calendar,
  ShoppingBag,
  AlertTriangle,
  Route,
} from 'lucide-react';
import { FormattedDate } from '@/features/shared/components/FormattedDate';
import type { OrderTimelineProps } from '../types';

export function OrderTimeline({ order }: OrderTimelineProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
      <div className="p-5 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Route className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-body">Seguimiento</h2>
            <p className="text-xs text-text-muted">Progreso de tu pedido paso a paso</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="relative flex flex-col gap-y-10 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-border-subtle">
          {/* 1. Created */}
          <div className="relative flex items-center gap-5 group">
            <div className="flex items-center justify-center size-10 rounded-full border-4 border-background bg-primary text-white shadow-md z-10">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-text-body">Pedido Realizado</h3>
                <span className="text-xs font-medium text-text-muted">
                  <FormattedDate date={order.createdAt} />
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Recibimos tu solicitud correctamente.
              </p>
            </div>
          </div>

          {/* 2. Paid */}
          {['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(order.status) && (
            <div className="relative flex items-center gap-5 group">
              <div className="flex items-center justify-center size-10 rounded-full border-4 border-background bg-primary text-white shadow-md z-10">
                <CheckCircle2 className="size-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-text-body">Pago Confirmado</h3>
                  <span className="text-xs font-medium text-primary">Verificado</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Tu pago ha sido validado y procesado.
                </p>
              </div>
            </div>
          )}

          {/* 3. Import Ordered */}
          {order.importationItems?.length > 0 && (
            <div className="relative flex items-center gap-5 group">
              <div
                className={`flex items-center justify-center size-10 rounded-full border-4 border-background shadow-md z-10 ${
                  order.importOrderedAt
                    ? 'bg-primary text-white'
                    : 'bg-surface-high text-text-muted'
                }`}
              >
                <ShoppingBag className="size-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-bold text-sm ${order.importOrderedAt ? 'text-text-body' : 'text-text-muted'}`}
                  >
                    Pedido al Proveedor
                  </h3>
                  <span className="text-xs font-medium text-text-muted">
                    {order.importOrderedAt ? (
                      <FormattedDate date={order.importOrderedAt} />
                    ) : (
                      'Pendiente'
                    )}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Importación solicitada al proveedor externo.
                </p>
              </div>
            </div>
          )}

          {/* 4. Arrival to MX — only relevant for import orders */}
          {order.importationItems?.length > 0 && (
            <div className="relative flex items-center gap-5 group">
              <div
                className={`flex items-center justify-center size-10 rounded-full border-4 border-background shadow-md z-10 ${
                  order.arrivedAt || order.status === 'COMPLETED'
                    ? 'bg-primary text-white'
                    : 'bg-surface-high text-text-muted'
                }`}
              >
                <Plane className="size-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-bold text-sm ${order.arrivedAt || order.status === 'COMPLETED' ? 'text-text-body' : 'text-text-muted'}`}
                  >
                    Llegada a México
                  </h3>
                  <span className="text-xs font-medium text-text-muted">
                    {order.arrivedAt ? (
                      <FormattedDate date={order.arrivedAt} />
                    ) : order.status === 'COMPLETED' ? (
                      'Completado'
                    ) : (
                      'En cálculo'
                    )}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Tránsito internacional e ingreso al país.
                </p>
              </div>
            </div>
          )}

          {/* 5. Delivery */}
          <div className="relative flex items-center gap-5 group">
            <div
              className={`flex items-center justify-center size-10 rounded-full border-4 border-background shadow-md z-10 ${
                order.status === 'COMPLETED'
                  ? 'bg-primary text-white'
                  : 'bg-surface-high text-text-muted'
              }`}
            >
              {order.status === 'COMPLETED' ? (
                <Package className="size-5" />
              ) : (
                <Calendar className="size-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3
                  className={`font-bold text-sm ${order.status === 'COMPLETED' ? 'text-text-body' : 'text-text-muted'}`}
                >
                  {order.status === 'COMPLETED' ? 'Entregado' : 'Entrega Estimada'}
                </h3>
                <span
                  className={`text-xs font-medium ${order.status === 'COMPLETED' ? 'text-primary' : 'text-text-muted'}`}
                >
                  {order.deliveredAt ? (
                    <FormattedDate date={order.deliveredAt} />
                  ) : order.status === 'COMPLETED' ? (
                    'Completado'
                  ) : order.estimatedDeliveryAt ? (
                    <FormattedDate date={order.estimatedDeliveryAt} />
                  ) : (
                    'En cálculo'
                  )}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">Recepción final de tus artículos.</p>
            </div>
          </div>
        </div>

        {order.importationItems?.length > 0 && (
          <div className="mt-6 flex gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <span className="font-semibold text-amber-800 dark:text-amber-200">Importación:</span> Los artículos de importación
              pueden tardar hasta <span className="font-semibold text-amber-800 dark:text-amber-200">15–30 días</span> en pasar por
              aduana antes de ser entregados.
            </p>
          </div>
        )}

        {order.trackingEntries && order.trackingEntries.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-4 bg-primary/60 rounded-full"></div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Datos de Seguimiento
              </h3>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border-subtle">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-low border-b border-border-subtle">
                    <th className="text-left px-4 py-2.5 font-semibold text-text-muted">Fecha</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-text-muted">Hora</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-text-muted">Origen</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-text-muted">Evento</th>
                  </tr>
                </thead>
                <tbody>
                  {order.trackingEntries.map(
                    (
                      entry: { date: string; time: string; origin: string; event: string },
                      entryIdx: number
                    ) => (
                      <tr
                        key={`${entry.date}-${entry.time}`}
                        className={`border-b border-border-subtle last:border-0 transition-colors ${entryIdx === order.trackingEntries!.length - 1 ? 'bg-primary/5' : ''}`}
                      >
                        <td className="px-4 py-3 font-semibold text-text-body whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                          {entry.time}
                        </td>
                        <td className="px-4 py-3 text-text-muted">{entry.origin}</td>
                        <td className="px-4 py-3 text-text-body">{entry.event}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
