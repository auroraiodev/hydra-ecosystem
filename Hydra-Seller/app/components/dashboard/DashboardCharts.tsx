'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface RevenuePoint {
  period: string;
  revenue: number;
  orders: number;
}

const ChartsInner = dynamic(
  async () => {
    const {
      ComposedChart,
      Line,
      BarChart,
      Bar,
      XAxis,
      YAxis,
      CartesianGrid,
      Tooltip,
      ResponsiveContainer,
      Cell,
    } = await import('recharts');

    function Inner({
      revenueData,
      statusBarData,
    }: {
      revenueData: RevenuePoint[];
      statusBarData: { name: string; value: number; fill: string }[];
    }) {
      const formattedRevenueData = revenueData.map((r) => {
        const [year, month] = r.period.split('-').map(Number);
        return {
          ...r,
          period: format(new Date(year, month - 1, 1), 'MMM yy', { locale: es }),
        };
      });

      return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 glass-card p-8 border-none flex flex-col group/chart transition-all duration-500 hover:shadow-primary/5">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative size-11 shrink-0 flex items-center justify-center rounded-full bg-primary/[0.04] border border-primary/10 shadow-sm transition-transform duration-500 group-hover/chart:scale-110 group-hover/chart:border-primary/20 overflow-hidden">
                <Image
                  src="/cat.png"
                  alt="Hydra"
                  width={24}
                  height={24}
                  className="object-contain opacity-80 group-hover/chart:opacity-100 transition-opacity"
                  unoptimized
                />
                <div className="absolute inset-0 rounded-full bg-primary/5 blur-sm opacity-0 group-hover/chart:opacity-100 transition-opacity" />
              </div>
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/80 leading-none">
                  Tendencia de Ingresos
                </h3>
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1.5 leading-none">
                  Ventas y pedidos por mes
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={formattedRevenueData}>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="oklch(0.65 0.18 175 / 0.15)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    axisLine={{ stroke: 'oklch(0.2 0.03 175 / 0.1)' }}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 900, fill: 'oklch(0.2 0.03 175 / 0.5)' }}
                    className="uppercase tracking-widest"
                  />
                  <YAxis
                    yAxisId="revenue"
                    axisLine={{ stroke: 'oklch(0.65 0.18 175 / 0.1)' }}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 900, fill: 'oklch(0.65 0.18 175 / 0.8)' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 9,
                      fontWeight: 900,
                      fill: 'hsl(var(--muted-foreground) / 0.3)',
                    }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'oklch(0.65 0.18 175 / 0.05)' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid oklch(0.65 0.18 175 / 0.15)',
                      borderRadius: '16px',
                      boxShadow: '0 20px 40px -12px oklch(0.65 0.18 175 / 0.15)',
                      fontSize: '11px',
                      fontWeight: 900,
                      padding: '16px',
                    }}
                    formatter={(value: number, name: string) =>
                      name === 'revenue'
                        ? [
                            value.toLocaleString('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                              maximumFractionDigits: 0,
                            }),
                            'INGRESOS',
                          ]
                        : [value, 'PEDIDOS']
                    }
                  />
                  <Bar
                    yAxisId="revenue"
                    dataKey="revenue"
                    fill="var(--primary)"
                    radius={[6, 6, 0, 0]}
                    barSize={24}
                  />
                  <Line
                    yAxisId="orders"
                    type="stepAfter"
                    dataKey="orders"
                    stroke="oklch(0.2 0.03 175 / 0.4)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'white', strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-8 border-none flex flex-col group/chart transition-all duration-500 hover:shadow-primary/5">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative size-11 shrink-0 flex items-center justify-center rounded-full bg-primary/[0.04] border border-primary/10 shadow-sm transition-transform duration-500 group-hover/chart:scale-110 group-hover/chart:border-primary/20 overflow-hidden">
                <Image
                  src="/cat.png"
                  alt="Hydra"
                  width={24}
                  height={24}
                  className="object-contain opacity-80 group-hover/chart:opacity-100 transition-opacity"
                  unoptimized
                />
                <div className="absolute inset-0 rounded-full bg-primary/5 blur-sm opacity-0 group-hover/chart:opacity-100 transition-opacity" />
              </div>
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/80 leading-none">
                  Estado de Pedidos
                </h3>
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1.5 leading-none">
                  Distribución de mis ventas
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBarData} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={{ stroke: 'oklch(0.2 0.03 175 / 0.1)' }}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 900, fill: 'oklch(0.2 0.03 175 / 0.8)' }}
                    width={80}
                    className="uppercase tracking-widest"
                  />
                  <Tooltip
                    cursor={{ fill: 'oklch(0.65 0.18 175 / 0.05)' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid oklch(0.65 0.18 175 / 0.15)',
                      borderRadius: '16px',
                      boxShadow: '0 20px 40px -12px oklch(0.65 0.18 175 / 0.15)',
                      fontSize: '11px',
                      fontWeight: 900,
                      padding: '16px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                    {statusBarData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    }

    return Inner;
  },
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> }
);

export function DashboardCharts({
  revenueData,
  statusBarData,
}: {
  revenueData: RevenuePoint[];
  statusBarData: { name: string; value: number; fill: string }[];
}) {
  return <ChartsInner revenueData={revenueData} statusBarData={statusBarData} />;
}
