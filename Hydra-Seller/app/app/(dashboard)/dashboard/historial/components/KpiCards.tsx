'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowTrending24Regular,
  ArrowTrendingDown24Regular,
  Pulse24Regular,
} from '@fluentui/react-icons';

function fmtMXN(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

interface KpiCardsProps {
  isLoading: boolean;
  credits: number;
  debits: number;
  totalRecords: number;
}

export function KpiCards({ isLoading, credits, debits, totalRecords }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Entradas (página actual)</p>
              <p className="text-2xl font-bold text-emerald-600">
                {isLoading ? '—' : fmtMXN(credits)}
              </p>
            </div>
            <ArrowTrending24Regular className="size-8 text-emerald-300" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Salidas (página actual)</p>
              <p className="text-2xl font-bold text-red-500">
                {isLoading ? '—' : fmtMXN(debits)}
              </p>
            </div>
            <ArrowTrendingDown24Regular className="size-8 text-red-300" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de registros</p>
              <p className="text-2xl font-bold">
                {isLoading ? '—' : totalRecords.toLocaleString()}
              </p>
            </div>
            <Pulse24Regular className="size-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
