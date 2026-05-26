'use client';

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
  ArrowTrending24Regular,
  ArrowTrendingDown24Regular,
  History24Regular,
} from '@fluentui/react-icons';
import { useHistorialManager } from './hooks/useHistorialManager';

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
  const {
    filtered,
    pagination,
    isLoading,
    filter,
    dispatchFilter,
    totals,
  } = useHistorialManager();

  return (
    <PageLayout>
      <PageHeader
        title="Historial de Transacciones"
        description="Registro completo de todos los movimientos financieros de la plataforma."
      />

      <div className="space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entradas (página actual)</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {isLoading ? '—' : fmtMXN(totals.credits)}
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
                    {isLoading ? '—' : fmtMXN(totals.debits)}
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
                    {isLoading ? '—' : pagination.total.toLocaleString()}
                  </p>
                </div>
                <History24Regular className="size-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario, correo o descripción..."
              className="pl-9"
              value={filter.search}
              onChange={(e) => dispatchFilter({ type: 'SET_SEARCH', search: e.target.value })}
            />
          </div>
          <Select
            value={filter.typeFilter}
            onValueChange={(v) => {
              dispatchFilter({ type: 'SET_TYPE_FILTER', typeFilter: v });
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
                {['sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'sk6', 'sk7', 'sk8'].map((k) => (
                  <div key={k} className="flex items-center gap-3">
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
                           <ClientDate
                             date={t.created_at}
                             formatter={(d) =>
                                format(d, 'dd MMM yyyy, HH:mm', { locale: es })
                             }
                           />
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
                      disabled={filter.page === 1}
                      onClick={() =>
                        dispatchFilter({ type: 'SET_PAGE', page: Math.max(1, filter.page - 1) })
                      }
                    >
                      <ChevronLeft24Regular className="size-4" />
                    </Button>
                    <Button
                      aria-label="Página siguiente"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={filter.page >= pagination.totalPages}
                      onClick={() => dispatchFilter({ type: 'SET_PAGE', page: filter.page + 1 })}
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
