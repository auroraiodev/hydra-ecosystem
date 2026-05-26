'use client';

import { useEffect, useState, useCallback, useReducer } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClientDate } from '@/components/ClientDate';
import {
  Search24Regular,
  ArrowUpRight24Regular,
  ArrowDownLeft24Regular,
  Wallet24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
} from '@fluentui/react-icons';
import { toast } from 'sonner';
import { KpiCards } from './components/KpiCards';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  users: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ElementType; sign: '+' | '-' | '' }
> = {
  SALE_PROCEEDS: {
    label: 'Venta',
    badgeClass: 'bg-green-100 text-green-700 hover:bg-green-100',
    icon: ArrowDownLeft24Regular,
    sign: '+',
  },
  WITHDRAWAL: {
    label: 'Retiro',
    badgeClass: 'bg-red-100 text-red-700 hover:bg-red-100',
    icon: ArrowUpRight24Regular,
    sign: '-',
  },
  PURCHASE: {
    label: 'Compra',
    badgeClass: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    icon: ArrowUpRight24Regular,
    sign: '-',
  },
  ORDER_REFUND: {
    label: 'Reembolso',
    badgeClass: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    icon: ArrowDownLeft24Regular,
    sign: '+',
  },
  ADJUSTMENT: {
    label: 'Ajuste',
    badgeClass: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    icon: Wallet24Regular,
    sign: '',
  },
};

function fmtMXN(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type];
  if (!cfg) return <Badge variant="outline">{type}</Badge>;
  return <Badge className={`${cfg.badgeClass} shrink-0`}>{cfg.label}</Badge>;
}

export default function HistorialPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const limit = 25;

  type DataState = { isLoading: boolean; totals: { credits: number; debits: number; adjustments: number } };
  const [dataState, dispatchData] = useReducer(
    (s: DataState, a: Partial<DataState>): DataState => ({ ...s, ...a }),
    { isLoading: true, totals: { credits: 0, debits: 0, adjustments: 0 } }
  );
  const { isLoading, totals } = dataState;

  type FilterState = { search: string; typeFilter: string; page: number };
  const [filterState, dispatchFilter] = useReducer(
    (s: FilterState, a: Partial<FilterState>): FilterState => ({ ...s, ...a }),
    { search: '', typeFilter: 'all', page: 1 }
  );
  const { search, typeFilter, page } = filterState;

  const fetchTransactions = useCallback(async () => {
    dispatchData({ isLoading: true });
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      });

      const res = await fetch(`/api/proxy/admin/wallet/transactions?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to fetch');

      const json = await res.json();
      const body = json.data || json;
      const rows: Transaction[] = body.data || [];

      setTransactions(rows);
      setPagination(body.pagination ?? { page, limit, total: rows.length, totalPages: 1 });

      // Compute visible-page totals
      let credits = 0,
        debits = 0,
        adjustments = 0;
      rows.forEach((t) => {
        if (t.type === 'ADJUSTMENT') adjustments += Math.abs(t.amount);
        else if (t.amount > 0) credits += t.amount;
        else debits += Math.abs(t.amount);
      });
      dispatchData({ totals: { credits, debits, adjustments } });
    } catch {
      toast.error('No se pudo cargar el historial de transacciones');
    } finally {
      dispatchData({ isLoading: false });
    }
  }, [page, limit, typeFilter]);

  useEffect(() => {
    const t = setTimeout(fetchTransactions, 300);
    return () => clearTimeout(t);
  }, [fetchTransactions]);

  // Client-side search filter (backend doesn't support search on this endpoint yet)
  const filtered = search.trim()
    ? transactions.filter((t) => {
        const q = search.toLowerCase();
        const name = `${t.users.first_name} ${t.users.last_name}`.toLowerCase();
        return (
          name.includes(q) ||
          t.users.email.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q)
        );
      })
    : transactions;

  return (
    <PageLayout>
      <PageHeader
        title="Historial de Transacciones"
        description="Registro completo de todos los movimientos financieros de la plataforma."
      />

      <div className="space-y-6">
        <KpiCards
          isLoading={isLoading}
          credits={totals.credits}
          debits={totals.debits}
          totalRecords={pagination.total}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario, correo o descripción..."
              className="pl-9"
              value={search}
               onChange={(e) => dispatchFilter({ search: e.target.value })}
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              dispatchFilter({ typeFilter: v, page: 1 });
            }}
          >
            <SelectTrigger className="sm:w-[200px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="SALE_PROCEEDS">Ventas</SelectItem>
              <SelectItem value="WITHDRAWAL">Retiros</SelectItem>
              <SelectItem value="PURCHASE">Compras con wallet</SelectItem>
              <SelectItem value="ORDER_REFUND">Reembolsos</SelectItem>
              <SelectItem value="ADJUSTMENT">Ajustes manuales</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Movimientos</CardTitle>
            <CardDescription>
              {isLoading
                ? 'Cargando...'
                : `Mostrando ${filtered.length} de ${pagination.total} registros`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {['sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'sk6', 'sk7', 'sk8'].map((id) => (
                  <div key={id} className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No se encontraron transacciones.
              </div>
            ) : (
              <>
                {/* Mobile view */}
                <div className="block sm:hidden divide-y">
                  {filtered.map((t) => {
                    const cfg = TYPE_CONFIG[t.type];
                    const Icon = cfg?.icon ?? Wallet24Regular;
                    const amountColor =
                      t.amount > 0
                        ? 'text-green-600'
                        : t.amount < 0
                          ? 'text-red-500'
                          : 'text-purple-600';
                    const sign = t.amount > 0 ? '+' : '';
                    return (
                      <div key={t.id} className="px-4 py-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="size-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {t.users.first_name} {t.users.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {t.users.email}
                              </p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold shrink-0 ${amountColor}`}>
                            {sign}
                            {fmtMXN(t.amount)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 pl-6">
                          {t.description}
                        </p>
                        <div className="flex items-center justify-between pl-6">
                          <TypeBadge type={t.type} />
                          <span className="text-xs text-muted-foreground">
                            <ClientDate
                              date={t.created_at}
                              formatter={(d) =>
                                format(d, 'dd MMM yyyy, HH:mm', { locale: es })
                              }
                            />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="h-11 px-4 text-left font-medium">Fecha</th>
                        <th className="h-11 px-4 text-left font-medium">Usuario</th>
                        <th className="h-11 px-4 text-left font-medium">Tipo</th>
                        <th className="h-11 px-4 text-left font-medium">Descripción</th>
                        <th className="h-11 px-4 text-right font-medium">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t) => {
                        const amountColor =
                          t.amount > 0
                            ? 'text-green-600'
                            : t.amount < 0
                              ? 'text-red-500'
                              : 'text-purple-600';
                        const sign = t.amount > 0 ? '+' : '';
                        return (
                          <tr key={t.id} className="border-b hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                              <ClientDate
                                date={t.created_at}
                                formatter={(d) =>
                                  format(d, 'dd MMM yyyy, HH:mm', { locale: es })
                                }
                              />
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium leading-none">
                                {t.users.first_name} {t.users.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {t.users.email}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <TypeBadge type={t.type} />
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-sm truncate">
                              {t.description || '—'}
                            </td>
                            <td className={`px-4 py-3 text-right font-semibold ${amountColor}`}>
                              {sign}
                              {fmtMXN(t.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      aria-label="Página anterior"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page === 1}
                      onClick={() => dispatchFilter({ page: Math.max(1, page - 1) })}
                    >
                      <ChevronLeft24Regular className="size-4" />
                    </Button>
                    <Button
                      aria-label="Página siguiente"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page >= pagination.totalPages}
                      onClick={() => dispatchFilter({ page: page + 1 })}
                    >
                      <ChevronRight24Regular className="size-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
