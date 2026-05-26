'use client';

import { useEffect, useState, useCallback, useReducer } from 'react';
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
import { Dismiss24Regular } from '@fluentui/react-icons';
import { adminAPI } from '@/lib/api';
import { toast } from 'sonner';

import { AnalyticsKpiCards } from './components/AnalyticsKpiCards';
import { TopBuyersCard } from './components/TopBuyersCard';
import { ProductRevenueCard } from './components/ProductRevenueCard';

export interface TopProduct {
  id: string;
  name: string;
  expansion: string | null;
  unitsSold: number;
  revenue: number;
}

export interface BuyerStats {
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

export default function AnalyticsPage() {

  const MONTHS = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  const CURRENT_YEAR = new Date().getFullYear();
  const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - i);

  function periodLabel(year: number | null, month: number | null): string {
    if (!year) return 'Todos los períodos';
    if (!month) return String(year);
    const monthLabel = MONTHS.find(m => m.value === String(month))?.label || '';
    return `${monthLabel} ${year}`;
  }

  const [data, dispatchData] = useReducer(dataReducer, {
    topProducts: [] as TopProduct[],
    buyerStats: null as BuyerStats | null,
    isLoading: true,
  });

  const [selectedYear, setSelectedYear] = useState<number | null>(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);

  const load = useCallback(async () => {
    dispatchData({ type: 'LOAD_START' });
    try {
      const [productRes, buyerRes] = await Promise.all([
        adminAPI.getProductAnalytics(10, 5, selectedYear ?? undefined, selectedMonth ?? undefined),
        adminAPI.getBuyerAnalytics(selectedYear ?? undefined, selectedMonth ?? undefined),
      ]);

      const productData = productRes?.data || productRes;
      const buyerData = buyerRes?.data || buyerRes;

      dispatchData({
        type: 'LOAD_SUCCESS',
        topProducts: productData?.topProducts ?? [],
        buyerStats: buyerData ?? null,
      });
    } catch {
      toast.error('No se pudieron cargar los datos de analíticas');
      dispatchData({ type: 'LOAD_ERROR' });
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  const clearPeriod = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  const isFiltered = selectedYear !== null;
  const currentPeriodLabel = periodLabel(selectedYear, selectedMonth);

  return (
    <PageLayout>
      <PageHeader
        title="Analytics"
        description="Reportes de ventas, productos más vendidos y comportamiento de compradores."
      />

      <div className="space-y-6">
        {/* Period filter */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedYear ? String(selectedYear) : 'all'}
            onValueChange={(v) => {
              setSelectedYear(v === 'all' ? null : Number(v));
              setSelectedMonth(null);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los años</SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedMonth ? String(selectedMonth) : 'all'}
            onValueChange={(v) => setSelectedMonth(v === 'all' ? null : Number(v))}
            disabled={!selectedYear}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isFiltered && (
            <Button variant="ghost" size="sm" onClick={clearPeriod} className="gap-1.5">
              <Dismiss24Regular className="size-3.5" />
              Limpiar filtro
            </Button>
          )}

          {isFiltered && (
            <span className="text-sm text-muted-foreground">
              Mostrando:{' '}
              <span className="font-medium text-foreground">
                {currentPeriodLabel}
              </span>
            </span>
          )}
        </div>

        {/* Buyer KPI cards */}
        <AnalyticsKpiCards isLoading={data.isLoading} buyerStats={data.buyerStats} />

        {/* Top buyers + product revenue table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopBuyersCard 
            isLoading={data.isLoading} 
            topBuyers={data.buyerStats?.topBuyers || []} 
            periodLabel={isFiltered ? currentPeriodLabel : ''} 
          />

          <ProductRevenueCard 
            isLoading={data.isLoading} 
            topProducts={data.topProducts} 
            periodLabel={isFiltered ? currentPeriodLabel : ''} 
          />
        </div>
      </div>
    </PageLayout>
  );
}

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true };
    case 'LOAD_SUCCESS':
      return { topProducts: action.topProducts, buyerStats: action.buyerStats, isLoading: false };
    case 'LOAD_ERROR':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

interface DataState {
  topProducts: TopProduct[];
  buyerStats: BuyerStats | null;
  isLoading: boolean;
}

type DataAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; topProducts: TopProduct[]; buyerStats: BuyerStats | null }
  | { type: 'LOAD_ERROR' };
