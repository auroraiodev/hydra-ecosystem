import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TopProduct {
  id: string;
  name: string;
  expansion: string | null;
  unitsSold: number;
  revenue: number;
}

interface ProductRevenueCardProps {
  isLoading: boolean;
  topProducts: TopProduct[];
  periodLabel: string;
}

export function ProductRevenueCard({ isLoading, topProducts, periodLabel }: ProductRevenueCardProps) {
  const CHART_COLORS = [
    '#6366f1',
    '#8b5cf6',
    '#a78bfa',
    '#c4b5fd',
    '#7c3aed',
    '#9333ea',
    '#a855f7',
    '#d946ef',
    '#ec4899',
    '#f43f5e',
  ];

  function fmtMXN(n: number) {
    return n.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Ingresos por carta</CardTitle>
        <CardDescription className="text-xs">
          Revenue generado en órdenes pagadas (inventario local)
          {periodLabel && ` · ${periodLabel}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {['sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'sk6'].map((k) => (
              <div key={k} className="flex items-center gap-3">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">Sin datos en este período.</p>
        ) : (
          <div className="divide-y">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
              <span>Carta</span>
              <span className="text-right">Uds</span>
              <span className="text-right">Ingreso</span>
            </div>
            {topProducts.slice(0, 10).map((p, i) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2.5 items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  {p.expansion && (
                    <p className="text-xs text-muted-foreground truncate">{p.expansion}</p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground text-right">
                  {p.unitsSold}
                </span>
                <span
                  className="text-sm font-semibold text-right"
                  style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                >
                  {fmtMXN(p.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
