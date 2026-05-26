'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClientDate } from '@/components/ClientDate';
import {
  ArrowTrending24Regular,
  ArrowUpRight24Regular,
  Clock24Regular,
  Box24Regular,
  Cart24Regular,
  VehicleTruck24Regular,
  CheckmarkCircle24Regular,
  DismissCircle24Regular,
  Payment24Regular,
} from '@fluentui/react-icons';
import { cn } from '@/lib/utils';
import DashboardCharts from '@/components/dashboard/DashboardChartsWrapper';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }
> = {
  PENDING: { label: 'Pendiente', color: '#f59e0b', icon: Clock24Regular },
  PAID: { label: 'Pagado', color: '#3b82f6', icon: Payment24Regular },
  PROCESSING: { label: 'Procesando', color: '#8b5cf6', icon: Box24Regular },
  SHIPPED: { label: 'Enviado', color: '#06b6d4', icon: VehicleTruck24Regular },
  COMPLETED: { label: 'Completado', color: '#10b981', icon: CheckmarkCircle24Regular },
  CANCELLED: { label: 'Cancelado', color: '#ef4444', icon: DismissCircle24Regular },
};

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  href?: string;
}

function StatCard({ title, value, sub, icon: Icon, iconColor, href }: StatCardProps) {
  const inner = (
    <CardContent className="p-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
            {title}
          </p>
          <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums">
            {value}
          </p>
          <p className="text-[10px] font-bold text-foreground/50 tracking-wide">{sub}</p>
        </div>
        <div className={cn('p-3 rounded-2xl shadow-lush shrink-0', iconColor)}>
          <Icon className="size-5 text-white" />
        </div>
      </div>
      {href && (
        <div className="mt-6 pt-6 border-t border-primary/5">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary group-hover:gap-2.5 transition-all">
            Explorar <ArrowUpRight24Regular className="size-3" />
          </p>
        </div>
      )}
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        <Card className="glass-card overflow-hidden border-none hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
          {inner}
        </Card>
      </Link>
    );
  }

  return <Card className="glass-card overflow-hidden border-none">{inner}</Card>;
}

interface DashboardStats {
  totalRevenue?: number;
  revenueToday?: number;
  totalOrders?: number;
  ordersToday?: number;
  totalProducts?: number;
  lowStockAlerts?: unknown[];
}

interface OrderStats {
  pendingOrders?: number;
  paidOrders?: number;
  processingOrders?: number;
  shippedOrders?: number;
  completedOrders?: number;
  cancelledOrders?: number;
  totalOrders?: number;
  averageOrderValue?: number;
}

interface RevenuePoint {
  period: string;
  revenue: number;
  orders: number;
}

interface DashboardContentProps {
  stats?: DashboardStats;
  revenueData: RevenuePoint[];
  statusBarData: { name: string; value: number; fill: string }[];
  orderStats?: OrderStats;
  recentOrders: Record<string, unknown>[];
}

export function DashboardContent({
  stats,
  revenueData,
  statusBarData,
  orderStats,
  recentOrders,
}: DashboardContentProps) {
  return (
    <div className="space-y-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-2">
          <StatCard
            title="Ventas Totales"
            value={Number(stats?.totalRevenue ?? 0).toLocaleString('es-MX', {
              style: 'currency',
              currency: 'MXN',
              maximumFractionDigits: 0,
            })}
            sub={`+${Number(stats?.revenueToday ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })} hoy`}
            icon={ArrowTrending24Regular}
            iconColor="bg-emerald-500 shadow-emerald-500/20"
            href="/dashboard/wallet"
          />
        </div>
        <StatCard
          title="Mis Pedidos"
          value={Number(stats?.totalOrders ?? 0).toLocaleString()}
          sub={`+${stats?.ordersToday ?? 0} hoy`}
          icon={Cart24Regular}
          iconColor="bg-[#2d2d30] shadow-[#2d2d30]/20"
          href="/dashboard/orders"
        />
        <StatCard
          title="Mis Productos"
          value={(stats?.totalProducts ?? 0).toLocaleString()}
          sub={`${stats?.lowStockAlerts?.length ?? 0} con stock bajo`}
          icon={Box24Regular}
          iconColor="bg-primary shadow-primary/20"
          href="/dashboard/products"
        />
      </div>

      <div>
        <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
          <DashboardCharts revenueData={revenueData} statusBarData={statusBarData} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        {/* Recent Orders */}
        <Card className="glass-card overflow-hidden border-none">
          <div className="bg-primary/[0.03] px-8 py-5 border-b border-primary/5 flex items-center justify-between group/header">
            <div className="flex items-center gap-4">
              <div className="relative size-8 shrink-0 flex items-center justify-center rounded-full bg-primary/[0.04] border border-primary/10 shadow-sm transition-transform duration-500 group-hover/header:scale-110 group-hover/header:border-primary/20 overflow-hidden">
                <Image
                  src="/cat.png"
                  alt="Hydra"
                  width={18}
                  height={18}
                  className="object-contain opacity-70 group-hover/header:opacity-100 transition-opacity"
                  unoptimized
                />
              </div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
                Pedidos Recientes
              </h3>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:gap-2 flex items-center gap-1.5 transition-all"
            >
              Ver Todos <ArrowUpRight24Regular className="size-3" />
            </Link>
          </div>
          <CardContent className="p-0">
            {!recentOrders.length ? (
              <p className="text-sm text-muted-foreground p-8 text-center italic">
                Sin pedidos recientes.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.slice(0, 8).map((order) => {
                  const status = String(order.status ?? '');
                  const cfg = STATUS_CONFIG[status] ?? {
                    label: status,
                    color: '#6b7280',
                    icon: Clock24Regular,
                  };
                  const Icon = cfg.icon;
                  return (
                    <Link
                      key={String(order.id ?? '')}
                      href={`/dashboard/orders/${String(order.id ?? '')}`}
                      className="flex items-center gap-4 px-8 py-6 hover:bg-primary/[0.02] transition-all duration-300 group"
                    >
                      <div className="p-2.5 rounded-xl border border-primary/5 bg-primary/5 group-hover:scale-110 transition-transform">
                        <Icon className="size-4 shrink-0" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black tracking-tight tabular-nums">
                          #
                          {String(order.id ?? '')
                            .slice(0, 8)
                            .toUpperCase()}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                          {order.createdAt ? (
                            <ClientDate
                              date={String(order.createdAt)}
                              formatter={(d) => format(d, 'd MMM, yyyy', { locale: es })}
                            />
                          ) : (
                            '—'
                          )}
                        </p>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-current/10"
                        style={{
                          backgroundColor: cfg.color + '10',
                          color: cfg.color,
                        }}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-sm font-black text-right min-w-[100px] tabular-nums">
                        {Number(order.total ?? 0).toLocaleString('es-MX', {
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

        {/* Monthly breakdown table */}
        <Card className="glass-card overflow-hidden border-none">
          <div className="bg-primary/[0.03] px-8 py-5 border-b border-primary/5 group/header">
            <div className="flex items-center gap-4">
              <div className="relative size-8 shrink-0 flex items-center justify-center rounded-full bg-primary/[0.04] border border-primary/10 shadow-sm transition-transform duration-500 group-hover/header:scale-110 group-hover/header:border-primary/20 overflow-hidden">
                <Image
                  src="/cat.png"
                  alt="Hydra"
                  width={18}
                  height={18}
                  className="object-contain opacity-70 group-hover/header:opacity-100 transition-opacity"
                  unoptimized
                />
              </div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
                Mis Ventas Mensuales
              </h3>
            </div>
          </div>
          <CardContent className="p-0">
            {revenueData.length === 0 ? (
              <p className="text-sm text-muted-foreground p-8 text-center italic">
                Sin datos disponibles.
              </p>
            ) : (
              <>
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-3 px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 bg-primary/[0.01]">
                    <span>Periodo</span>
                    <span className="text-right">Ventas</span>
                    <span className="text-right">Operaciones</span>
                  </div>
                  {[...revenueData]
                    .reverse()
                    .slice(0, 6)
                    .map((row) => {
                      const period = row.period ?? '';
                      const [year, month] = period.split('-').map(Number);
                      const monthDateStr =
                        year && month
                          ? `${year}-${String(month).padStart(2, '0')}-01`
                          : null;
                      return (
                        <div
                          key={row.period}
                          className="grid grid-cols-3 px-8 py-6 text-sm items-center hover:bg-primary/[0.01] transition-all"
                        >
                          <span className="font-black uppercase text-[11px] tracking-tight text-foreground/70">
                            {monthDateStr ? (
                              <ClientDate
                                date={monthDateStr}
                                formatter={(d) => format(d, 'MMMM yyyy', { locale: es })}
                              />
                            ) : (
                              period
                            )}
                          </span>
                          <span className="text-right text-primary font-black tabular-nums">
                            {Number(row.revenue ?? 0).toLocaleString('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                              maximumFractionDigits: 0,
                            })}
                          </span>
                          <span className="text-right font-black tabular-nums text-muted-foreground/30">
                            {row.orders}
                          </span>
                        </div>
                      );
                    })}
                </div>
                {orderStats && (
                  <div className="grid grid-cols-3 gap-6 p-8 border-t border-primary/5 bg-primary/[0.02]">
                    <div className="text-center space-y-1">
                      <p className="text-[9px] uppercase font-black text-muted-foreground/40 tracking-widest">
                        Ticket Prom.
                      </p>
                      <p className="text-sm font-black tabular-nums">
                        {Number(orderStats?.averageOrderValue ?? 0).toLocaleString('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div className="text-center border-x border-primary/10 space-y-1">
                      <p className="text-[9px] uppercase font-black text-muted-foreground/40 tracking-widest">
                        Tasa Cierre
                      </p>
                      <p className="text-sm font-black text-primary tabular-nums">
                        {(
                          ((orderStats?.completedOrders ?? 0) /
                            ((orderStats?.totalOrders ?? 0) || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[9px] uppercase font-black text-muted-foreground/40 tracking-widest">
                        Cancelados
                      </p>
                      <p className="text-sm font-black text-destructive/60 tabular-nums">
                        {orderStats?.cancelledOrders ?? 0}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
