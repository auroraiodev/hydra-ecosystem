import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { serverSellerAPI } from '@/lib/server-api';
import { DashboardContent } from './dashboard-content';

export default async function DashboardPage() {
  // Fetch initial data on the server
  const [stats, orderStats, rawRevenueData] = await Promise.all([
    serverSellerAPI.getDashboardStats().catch(() => null),
    serverSellerAPI.getOrderStats().catch(() => null),
    serverSellerAPI.getRevenueAnalytics(180).catch(() => []),
  ]);

  // Backend may return { data: [...] } or a plain array — normalise to array
  const revenueData = Array.isArray(rawRevenueData)
    ? (rawRevenueData as { period: string; revenue: number; orders: number }[])
    : Array.isArray(rawRevenueData?.data)
      ? (rawRevenueData.data as { period: string; revenue: number; orders: number }[])
      : [];

  // Normalise recentOrders the same way — guard against non-array shapes
  const recentOrders = Array.isArray(stats?.recentOrders)
    ? (stats.recentOrders as Record<string, unknown>[])
    : Array.isArray(stats?.recentOrders?.data)
      ? (stats.recentOrders.data as Record<string, unknown>[])
      : [];

  const statusBarData = orderStats
    ? [
        { name: 'Pendiente', value: orderStats.pendingOrders ?? 0, fill: 'hsl(38 92% 50%)' },
        { name: 'Pagado', value: orderStats.paidOrders ?? 0, fill: 'hsl(217 91% 60%)' },
        { name: 'Procesando', value: orderStats.processingOrders ?? 0, fill: 'hsl(262 83% 58%)' },
        { name: 'Enviado', value: orderStats.shippedOrders ?? 0, fill: 'hsl(188 86% 45%)' },
        { name: 'Completado', value: orderStats.completedOrders ?? 0, fill: 'hsl(142 71% 45%)' },
        { name: 'Cancelado', value: orderStats.cancelledOrders ?? 0, fill: 'hsl(0 84% 60%)' },
      ]
    : [];

  return (
    <PageLayout>
      <PageHeader
        title="Mi Dashboard"
        description="Resumen de tus ventas y productos en el Marketplace."
      />

      <DashboardContent
        stats={stats}
        revenueData={revenueData}
        statusBarData={statusBarData}
        orderStats={orderStats}
        recentOrders={recentOrders}
      />
    </PageLayout>
  );
}
