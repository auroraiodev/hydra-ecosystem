'use client';

import { useEffect, useState, useCallback, useReducer } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  People24Regular,
  ShoppingBag24Regular,
  ArrowCounterclockwise24Regular,
  ArrowTrending24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { adminAPI } from '@/lib/api';
import { toast } from 'sonner';

interface TopProduct {
  id: string;
  name: string;
  expansion: string | null;
  unitsSold: number;
  revenue: number;
}

interface BuyerStats {
  uniqueBuyers: number;
  repeatBuyers: number;
  repeatBuyerRate: number;
  avgOrdersPerBuyer: number;
  topBuyers: Array<{
    id: string;
    name: string;
    email: string;
    orderCount: number;
    totalSpent: number;
  }>;
}

function fmtMXN(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed',
  '#9333ea', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

const MONTHS = [
  { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - i);

function periodLabel(year: number | null, month: number | null): string {
  if (!year) return 'Todos los períodos';
  if (!month) return String(year);
  return `${MONTHS[month - 1].label} ${year}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PeriodFilter({
  selectedYear, selectedMonth, isFiltered, onYearChange, onMonthChange, onClear,
}: {
  selectedYear: number | null; selectedMonth: number | null; isFiltered: boolean;
  onYearChange: (year: number | null, month: number | null) => void;
  onMonthChange: (month: number | null) => void; onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={selectedYear ? String(selectedYear) : 'all'}
        onValueChange={(v) => onYearChange(v === 'all' ? null : Number(v), null)}
      >
        <SelectTrigger className="w-[130px]"><SelectValue placeholder="Año" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los años</SelectItem>
          {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select
        value={selectedMonth ? String(selectedMonth) : 'all'}
        onValueChange={(v) => onMonthChange(v === 'all' ? null : Number(v))}
        disabled={!selectedYear}
      >
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Mes" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los meses</SelectItem>
          {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {isFiltered && (
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5">
          <Dismiss24Regular className="size-3.5" />Limpiar filtro
        </Button>
      )}
      {isFiltered && (
        <span className="text-sm text-muted-foreground">
          Mostrando: <span className="font-medium text-foreground">{periodLabel(selectedYear, selectedMonth)}</span>
        </span>
      )}
    </div>
  );
}

function BuyerKpiCards({ isLoading, buyerStats }: { isLoading: boolean; buyerStats: BuyerStats | null }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, n) => n).map((n) => (
          <Card key={`skel-kpi-${n}`}>
            <CardContent className="pt-6 space-y-2">
              <Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" />
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
              <p className="text-2xl font-bold mt-1">{(buyerStats?.uniqueBuyers ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500"><People24Regular className="size-5 text-white" /></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Compradores frecuentes</p>
              <p className="text-2xl font-bold mt-1">{(buyerStats?.repeatBuyers ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{buyerStats?.repeatBuyerRate ?? 0}% del total</p>
            </div>
            <div className="p-2 rounded-lg bg-violet-500"><ArrowCounterclockwise24Regular className="size-5 text-white" /></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Promedio de órdenes</p>
              <p className="text-2xl font-bold mt-1">{buyerStats?.avgOrdersPerBuyer ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">por comprador</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500"><ShoppingBag24Regular className="size-5 text-white" /></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Retención</p>
              <p className="text-2xl font-bold mt-1">{buyerStats?.repeatBuyerRate ?? 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">regresan a comprar</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-500"><ArrowTrending24Regular className="size-5 text-white" /></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TopBuyersCard({
  isLoading, buyerStats, isFiltered, selectedYear, selectedMonth,
}: { isLoading: boolean; buyerStats: BuyerStats | null; isFiltered: boolean; selectedYear: number | null; selectedMonth: number | null }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Mejores compradores</CardTitle>
        <CardDescription className="text-xs">
          Por dinero gastado en órdenes pagadas
          {isFiltered && ` · ${periodLabel(selectedYear, selectedMonth)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }, (_, n) => n).map((n) => (
              <div key={`skel-buyer-${n}`} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : !buyerStats?.topBuyers.length ? (
          <p className="text-sm text-muted-foreground p-4">Sin compradores en este período.</p>
        ) : (
          <div className="divide-y">
            {buyerStats.topBuyers.map((buyer, i) => (
              <div key={buyer.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm font-mono text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{buyer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{buyer.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="secondary" className="text-xs mb-0.5">
                    {buyer.orderCount} {buyer.orderCount === 1 ? 'orden' : 'órdenes'}
                  </Badge>
                  <p className="text-xs text-emerald-600 font-semibold">{fmtMXN(buyer.totalSpent)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProductRevenueCard({
  isLoading, topProducts, isFiltered, selectedYear, selectedMonth,
}: { isLoading: boolean; topProducts: TopProduct[]; isFiltered: boolean; selectedYear: number | null; selectedMonth: number | null }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Ingresos por carta</CardTitle>
        <CardDescription className="text-xs">
          Revenue generado en órdenes pagadas (inventario local)
          {isFiltered && ` · ${periodLabel(selectedYear, selectedMonth)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }, (_, n) => n).map((n) => (
              <div key={`skel-product-${n}`} className="flex items-center gap-3">
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
              <span>Carta</span><span className="text-right">Uds</span><span className="text-right">Ingreso</span>
            </div>
            {topProducts.slice(0, 10).map((p, i) => (
              <div key={p.id} className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2.5 items-center">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  {p.expansion && <p className="text-xs text-muted-foreground truncate">{p.expansion}</p>}
                </div>
                <span className="text-sm text-muted-foreground text-right">{p.unitsSold}</span>
                <span className="text-sm font-semibold text-right" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
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

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [buyerStats, setBuyerStats] = useState<BuyerStats | null>(null);

  type DataState = { isLoading: boolean };
  const [dataState, dispatchData] = useReducer(
    (s: DataState, a: Partial<DataState>): DataState => ({ ...s, ...a }),
    { isLoading: true }
  );
  const { isLoading } = dataState;

  type FilterState = { selectedYear: number | null; selectedMonth: number | null };
  const [filterState, dispatchFilter] = useReducer(
    (s: FilterState, a: Partial<FilterState>): FilterState => ({ ...s, ...a }),
    { selectedYear: CURRENT_YEAR, selectedMonth: new Date().getMonth() + 1 }
  );
  const { selectedYear, selectedMonth } = filterState;

  const load = useCallback(async () => {
    dispatchData({ isLoading: true });
    try {
      const [productRes, buyerRes] = await Promise.all([
        adminAPI.getProductAnalytics(10, 5, selectedYear ?? undefined, selectedMonth ?? undefined),
        adminAPI.getBuyerAnalytics(selectedYear ?? undefined, selectedMonth ?? undefined),
      ]);
      const productData = productRes?.data || productRes;
      const buyerData = buyerRes?.data || buyerRes;
      setTopProducts(productData?.topProducts ?? []);
      setBuyerStats(buyerData ?? null);
    } catch {
      toast.error('No se pudieron cargar los datos de analíticas');
    } finally {
      dispatchData({ isLoading: false });
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => { void load(); }, [load]);

  const isFiltered = selectedYear !== null;

  return (
    <PageLayout>
      <PageHeader
        title="Analytics"
        description="Reportes de ventas, productos más vendidos y comportamiento de compradores."
      />
      <div className="space-y-6">
        <PeriodFilter
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          isFiltered={isFiltered}
          onYearChange={(year, month) => dispatchFilter({ selectedYear: year, selectedMonth: month })}
          onMonthChange={(month) => dispatchFilter({ selectedMonth: month })}
          onClear={() => dispatchFilter({ selectedYear: null, selectedMonth: null })}
        />
        <BuyerKpiCards isLoading={isLoading} buyerStats={buyerStats} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopBuyersCard
            isLoading={isLoading} buyerStats={buyerStats}
            isFiltered={isFiltered} selectedYear={selectedYear} selectedMonth={selectedMonth}
          />
          <ProductRevenueCard
            isLoading={isLoading} topProducts={topProducts}
            isFiltered={isFiltered} selectedYear={selectedYear} selectedMonth={selectedMonth}
          />
        </div>
      </div>
    </PageLayout>
  );
}
