import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  People24Regular, 
  ShoppingBag24Regular, 
  ArrowRepeatAll24Regular, 
  ArrowTrending24Regular 
} from '@fluentui/react-icons';

interface AnalyticsKpiCardsProps {
  isLoading: boolean;
  buyerStats: {
    uniqueBuyers: number;
    repeatBuyers: number;
    repeatBuyerRate: number;
    avgOrdersPerBuyer: number;
  } | null;
}

export function AnalyticsKpiCards({ isLoading, buyerStats }: AnalyticsKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['kpi-1', 'kpi-2', 'kpi-3', 'kpi-4'].map((k) => (
          <Card key={k}>
            <CardContent className="pt-6 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Compradores únicos</p>
              <p className="text-2xl font-bold mt-1">
                {(buyerStats?.uniqueBuyers ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500">
              <People24Regular className="size-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Compradores frecuentes</p>
              <p className="text-2xl font-bold mt-1">
                {(buyerStats?.repeatBuyers ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {buyerStats?.repeatBuyerRate ?? 0}% del total
              </p>
            </div>
            <div className="p-2 rounded-lg bg-violet-500">
              <ArrowRepeatAll24Regular className="size-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Promedio de órdenes</p>
              <p className="text-2xl font-bold mt-1">
                {buyerStats?.avgOrdersPerBuyer ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">por comprador</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500">
              <ShoppingBag24Regular className="size-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Retención</p>
              <p className="text-2xl font-bold mt-1">
                {buyerStats?.repeatBuyerRate ?? 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">regresan a comprar</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-500">
              <ArrowTrending24Regular className="size-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
