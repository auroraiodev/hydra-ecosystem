import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface TopBuyer {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
}

interface TopBuyersCardProps {
  isLoading: boolean;
  topBuyers: TopBuyer[];
  periodLabel: string;
}

export function TopBuyersCard({ isLoading, topBuyers, periodLabel }: TopBuyersCardProps) {
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
        <CardTitle className="text-base">Mejores compradores</CardTitle>
        <CardDescription className="text-xs">
          Por dinero gastado en órdenes pagadas
          {periodLabel && ` · ${periodLabel}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {['sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'sk6'].map((k) => (
              <div key={k} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : !topBuyers.length ? (
          <p className="text-sm text-muted-foreground p-4">
            Sin compradores en este período.
          </p>
        ) : (
          <div className="divide-y">
            {topBuyers.map((buyer, i) => (
              <div key={buyer.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm font-mono text-muted-foreground w-5 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{buyer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{buyer.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="secondary" className="text-xs mb-0.5">
                    {buyer.orderCount} {buyer.orderCount === 1 ? 'orden' : 'órdenes'}
                  </Badge>
                  <p className="text-xs text-emerald-600 font-semibold">
                    {fmtMXN(buyer.totalSpent)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
