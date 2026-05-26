import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { serverAdminAPI } from '@/lib/server-api';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardCharts from '@/components/dashboard/DashboardChartsWrapper';
import { StatCard } from '@/components/dashboard/stat-card';
import { RecentOrders } from '@/components/dashboard/recent-orders';
import { ClientDate } from '@/components/ClientDate';

interface RevenuePoint {
  period: string;
  revenue: number;
  orders: number;
}

interface OrderSummary {
  id: string;
  status: string;
  createdAt: string;
  total: number;
}

export default async function DashboardPage() {
  // Fetch initial data on the server
  const [stats, orderStats, rawRevenueData] = await Promise.all([
    serverAdminAPI.getDashboardStats().catch(() => null),
    serverAdminAPI.getOrderStats().catch(() => null),
    serverAdminAPI.getRevenueAnalytics(180).catch(() => []),
  ]);

  // Backend may return { data: [...] } or a plain array — normalise to array
  const revenueData: RevenuePoint[] = Array.isArray(rawRevenueData)
    ? rawRevenueData
    : Array.isArray(rawRevenueData?.data)
      ? rawRevenueData.data
      : [];

  // Normalise recentOrders the same way — guard against non-array shapes
  const recentOrders: OrderSummary[] = Array.isArray(stats?.recentOrders)
    ? stats.recentOrders
    : Array.isArray(stats?.recentOrders?.data)
      ? stats.recentOrders.data
      : [];

  const statusBarData = orderStats
    ? [
        { name: 'Pendiente', value: orderStats.pendingOrders, fill: 'hsl(38 92% 50%)' },
        { name: 'Pagado', value: orderStats.paidOrders, fill: 'hsl(217 91% 60%)' },
        { name: 'Procesando', value: orderStats.processingOrders, fill: 'hsl(262 83% 58%)' },
        { name: 'Enviado', value: orderStats.shippedOrders, fill: 'hsl(188 86% 45%)' },
        { name: 'Completado', value: orderStats.completedOrders, fill: 'hsl(142 71% 45%)' },
        { name: 'Cancelado', value: orderStats.cancelledOrders, fill: 'hsl(0 84% 60%)' },
      ]
    : [];

  return (
    <PageLayout>
      <PageHeader
        title="Dashboard"
        description="Centro de control de las tres cabezas — resumen operativo en tiempo real."
      />

      <div className="space-y-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <StatCard
              title="Ingresos Totales"
              value={(stats?.totalRevenue ?? 0).toLocaleString('es-MX', {
                style: 'currency',
                currency: 'MXN',
                maximumFractionDigits: 0,
              })}
              sub={`+${(stats?.revenueToday ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })} hoy`}
              iconName="trending"
              iconColor="bg-emerald-500 shadow-emerald-500/20"
              href="/dashboard/wallet"
            />
          </div>
          <StatCard
            title="Usuarios Totales"
            value={(stats?.totalUsers ?? 0).toLocaleString()}
            sub={`+${stats?.newUsersToday ?? 0} hoy · ${stats?.activeUsers ?? 0} activos`}
            iconName="people"
            iconColor="bg-primary shadow-primary/20"
            href="/dashboard/users"
          />
          <StatCard
            title="Pedidos Totales"
            value={(stats?.totalOrders ?? 0).toLocaleString()}
            sub={`+${stats?.ordersToday ?? 0} hoy`}
            iconName="cart"
            iconColor="bg-[#2d2d30] shadow-[#2d2d30]/20"
            href="/dashboard/orders"
          />
        </div>

        <div>
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <DashboardCharts revenueData={revenueData} statusBarData={statusBarData} />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
          {/* Recent Orders */}
          <RecentOrders orders={recentOrders} />

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
                    style={{ width: 'auto', height: 'auto' }}
                    className="object-contain opacity-70 group-hover/header:opacity-100 transition-opacity"
                    unoptimized
                  />
                </div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/80 font-display">
                  Desglose Mensual
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
                    <div className="grid grid-cols-3 px-8 py-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40 bg-primary/[0.01]">
                      <span>Periodo</span>
                      <span className="text-right">Ventas</span>
                      <span className="text-right">Operaciones</span>
                    </div>
                    {[...revenueData]
                      .reverse()
                      .slice(0, 6)
                      .map((row) => {
                        const dateValue = row.period ?? '';
                        return (
                          <div
                            key={row.period}
                            className="grid grid-cols-3 px-8 py-6 text-sm items-center hover:bg-primary/[0.01] transition-all"
                          >
                            <span className="uppercase text-[11px] tracking-tight text-foreground/70 font-display" suppressHydrationWarning>
                              <ClientDate
                                date={dateValue}
                                format={{ month: 'long', year: 'numeric' }}
                              />
                            </span>
                            <span className="text-right text-primary font-semibold tabular-nums font-display" suppressHydrationWarning>
                              {(row.revenue ?? 0).toLocaleString('es-MX', {
                                style: 'currency',
                                currency: 'MXN',
                                maximumFractionDigits: 0,
                              })}
                            </span>
                            <span className="text-right font-semibold tabular-nums text-muted-foreground/30">
                              {row.orders}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  {orderStats && (
                    <div className="grid grid-cols-3 gap-6 p-8 border-t border-primary/5 bg-primary/[0.02]">
                      <div className="text-center space-y-1">
                        <p className="text-[9px] uppercase font-semibold text-muted-foreground/40 tracking-widest">
                          Ticket Prom.
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {(orderStats.averageOrderValue ?? 0).toLocaleString('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                      <div className="text-center border-x border-primary/10 space-y-1">
                        <p className="text-[9px] uppercase font-semibold text-muted-foreground/40 tracking-widest">
                          Tasa Cierre
                        </p>
                        <p className="text-sm font-semibold text-primary tabular-nums">
                          {(
                            (orderStats.completedOrders / (orderStats.totalOrders || 1)) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-[9px] uppercase font-semibold text-muted-foreground/40 tracking-widest">
                          Cancelados
                        </p>
                        <p className="text-sm font-semibold text-destructive/60 tabular-nums">
                          {orderStats.cancelledOrders}
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
    </PageLayout>
  );
}
