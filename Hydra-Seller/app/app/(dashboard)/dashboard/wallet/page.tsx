'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClientDate } from '@/components/ClientDate';
import {
  ArrowUpRight24Regular,
  ArrowDownLeft24Regular,
  Wallet24Regular,
  History24Regular,
  ArrowTrending24Regular,
  Info24Regular,
  Clock24Regular,
  CheckmarkCircle24Regular,
  BoxCheckmark24Regular,
  ImageShadow24Regular,
} from '@fluentui/react-icons';
import useSWR from 'swr';
import { toast } from 'sonner';
import { sellerAPI } from '@/lib/api';

import Image from 'next/image';
import { PayoutRequestDialog } from './components/PayoutRequestDialog';

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface SellerWallet {
  balance: number;
  transactions: WalletTransaction[];
}

interface PendingPayout {
  orderId: string;
  orderStatus: string;
  createdAt: string;
  subtotal: number;
  itemCount: number;
  items: { name: string; imageUrl: string | null; quantity: number; unitPrice: number }[];
}

function fmtMXN(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function useSellerWallet() {
  const { data, error, isLoading, mutate } = useSWR('seller-wallet', () => sellerAPI.getWallet());
  return { wallet: data as SellerWallet | null, error, isLoading, mutate };
}

function usePendingPayouts() {
  const { data, error, isLoading, mutate } = useSWR('pending-payouts', async () => {
    const res = await sellerAPI.getPendingPayouts();
    return Array.isArray(res) ? res : (res?.data ?? []);
  });
  return { pending: (data || []) as PendingPayout[], error, isLoading, mutate };
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface BalanceCardProps {
  isLoading: boolean;
  balance: number;
  pendingTotal: number;
  selectedCount: number;
  onRequestPayout: () => void;
}

function BalanceCard({ isLoading, balance, pendingTotal, selectedCount, onRequestPayout }: BalanceCardProps) {
  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-zinc-900 to-zinc-800 text-white shadow-xl">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Wallet24Regular className="size-32" />
      </div>
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
                Saldo Disponible
              </p>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
                {isLoading ? (
                  <Skeleton className="h-12 w-48 bg-zinc-700" />
                ) : (
                  fmtMXN(balance)
                )}
              </h2>
              <p className="text-zinc-500 text-xs">
                {pendingTotal > 0
                  ? `+ ${fmtMXN(pendingTotal)} en órdenes pendientes`
                  : 'Saldo acreditado disponible'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              size="lg"
              className="bg-white text-zinc-900 hover:bg-zinc-100 border-none font-bold px-8 shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
              onClick={onRequestPayout}
              disabled={isLoading || selectedCount === 0}
            >
              <ArrowUpRight24Regular className="mr-2 size-5" />
              Solicitar Cobro
              {selectedCount > 0 && (
                <span className="ml-2 bg-zinc-200 text-zinc-800 text-xs font-bold rounded-full px-2 py-0.5">
                  {selectedCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PendingOrdersTableProps {
  isLoading: boolean;
  pending: PendingPayout[];
  selectedIds: Set<string>;
  selectedTotal: number;
  pendingTotal: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onToggleOrder: (orderId: string) => void;
}

function PendingOrdersTable({
  isLoading,
  pending,
  selectedIds,
  selectedTotal,
  pendingTotal,
  allSelected,
  onToggleAll,
  onToggleOrder,
}: PendingOrdersTableProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader className="pb-2 flex-row items-center justify-between gap-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
          <BoxCheckmark24Regular className="size-4" />
          Órdenes pendientes de cobro
        </CardTitle>
        {!isLoading && selectedIds.size > 0 && (
          <span className="text-xs font-bold text-amber-700">
            Seleccionado: {fmtMXN(selectedTotal)}
          </span>
        )}
        {!isLoading && selectedIds.size === 0 && pending.length > 0 && (
          <span className="text-xs text-amber-600">{fmtMXN(pendingTotal)} en espera</span>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {['s1', 's2', 's3'].map((key) => (
              <Skeleton key={key} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200 bg-amber-100/50">
                  <th className="w-10 px-4 py-2.5">
                    {pending.length > 0 && (
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => onToggleAll()}
                        aria-label="Seleccionar todas"
                      />
                    )}
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-amber-800 text-xs uppercase tracking-wide">
                    Orden / Artículos
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-amber-800 text-xs uppercase tracking-wide hidden sm:table-cell">
                    Fecha
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-amber-800 text-xs uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold text-amber-800 text-xs uppercase tracking-wide">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {pending.map((p) => {
                  const isChecked = selectedIds.has(p.orderId);
                  return (
                    <tr
                      key={p.orderId}
                      className={`transition-colors cursor-pointer ${
                        isChecked ? 'bg-amber-100/70' : 'hover:bg-amber-50'
                      }`}
                      onClick={() => onToggleOrder(p.orderId)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => onToggleOrder(p.orderId)}
                        />
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-zinc-800 text-xs mb-1.5">
                          #{p.orderId.slice(0, 8).toUpperCase()}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.items.map((item) => (
                            <div
                              key={`${p.orderId}-${item.name}`}
                              className="flex items-center gap-1.5 bg-white rounded-md border border-amber-100 px-1.5 py-1 shadow-sm"
                            >
                              {item.imageUrl ? (
                                <div className="relative size-7 shrink-0">
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="rounded object-contain bg-zinc-50"
                                  />
                                </div>
                              ) : (
                                <div className="size-7 rounded bg-zinc-100 flex items-center justify-center shrink-0">
                                  <ImageShadow24Regular className="size-3.5 text-zinc-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium truncate max-w-[100px] text-zinc-700">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-zinc-400 tabular-nums">
                                  x{item.quantity} · {fmtMXN(item.unitPrice)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-xs text-zinc-500 hidden sm:table-cell whitespace-nowrap">
                        <ClientDate
                          date={p.createdAt}
                          formatter={(d) => format(d, "d 'de' MMMM", { locale: es })}
                        />
                      </td>
                      <td className="p-3">
                        <Badge className="text-xs whitespace-nowrap bg-amber-100 text-amber-700 border-amber-200">
                          Pendiente
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-bold text-amber-700 whitespace-nowrap tabular-nums">
                        {fmtMXN(p.subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {pending.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay órdenes pendientes.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionBadge({ type }: { type: string }) {
  switch (type) {
    case 'SALE_PROCEEDS':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shrink-0 border-emerald-200">
          Venta
        </Badge>
      );
    case 'WITHDRAWAL':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 shrink-0 border-amber-200">
          Retiro
        </Badge>
      );
    case 'PURCHASE':
      return (
        <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 shrink-0 border-sky-200">
          Compra
        </Badge>
      );
    case 'ADJUSTMENT':
      return (
        <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 shrink-0 border-violet-200">
          Ajuste
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="shrink-0">
          {type}
        </Badge>
      );
  }
}

function TransactionIcon({ type, amount }: { type: string; amount: number }) {
  if (type === 'WITHDRAWAL' || amount < 0)
    return (
      <div className="size-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
        <ArrowUpRight24Regular className="size-5 text-amber-500" />
      </div>
    );
  return (
    <div className="size-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
      <ArrowDownLeft24Regular className="size-5 text-emerald-500" />
    </div>
  );
}

export default function WalletPage() {
  const { wallet, isLoading: isLoadingWallet, mutate: mutateWallet } = useSellerWallet();
  const { pending, isLoading: isLoadingPending, mutate: mutatePending } = usePendingPayouts();
  const isLoading = isLoadingWallet || isLoadingPending;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutDetails, setPayoutDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshData = async () => {
    await Promise.all([mutateWallet(), mutatePending()]);
  };

  const allSelected = pending.length > 0 && pending.every((p) => selectedIds.has(p.orderId));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pending.map((p) => p.orderId)));
    }
  };

  const toggleOrder = (orderId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const selectedOrders = pending.filter((p) => selectedIds.has(p.orderId));
  const selectedTotal = selectedOrders.reduce((s, p) => s + p.subtotal, 0);
  const pendingTotal = pending.reduce((s, p) => s + p.subtotal, 0);

  const openPayoutDialog = () => {
    if (selectedIds.size === 0) {
      toast.error('Selecciona al menos una orden para solicitar el cobro');
      return;
    }
    setPayoutDetails('');
    setIsPayoutOpen(true);
  };

  const handlePayout = async () => {
    if (!payoutDetails.trim()) {
      toast.error('Ingresa los datos bancarios para la transferencia');
      return;
    }
    setIsSubmitting(true);
    try {
      await sellerAPI.requestPayout(Array.from(selectedIds), payoutDetails.trim());
      toast.success('Solicitud de cobro enviada correctamente');
      setIsPayoutOpen(false);
      setSelectedIds(new Set());
      await refreshData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Mi Billetera"
        description="Gestiona tus ganancias y solicita retiros de saldo."
      />

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Balance card */}
        <BalanceCard
          isLoading={isLoading}
          balance={wallet?.balance || 0}
          pendingTotal={pendingTotal}
          selectedCount={selectedIds.size}
          onRequestPayout={openPayoutDialog}
        />

        {/* Pending orders — selectable table */}
        {(isLoading || pending.length > 0) && (
          <PendingOrdersTable
            isLoading={isLoading}
            pending={pending}
            selectedIds={selectedIds}
            selectedTotal={selectedTotal}
            pendingTotal={pendingTotal}
            allSelected={allSelected}
            onToggleAll={toggleAll}
            onToggleOrder={toggleOrder}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="md:col-span-1 space-y-6">
            <Card className="shadow-sm border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
                  <ArrowTrending24Regular className="size-4" /> Resumen de Actividad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                  <span className="text-sm text-zinc-600">Ventas Totales</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {wallet?.transactions?.filter((t) => t.type === 'SALE_PROCEEDS').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                  <span className="text-sm text-zinc-600">Retiros Realizados</span>
                  <span className="text-sm font-semibold text-amber-600">
                    {wallet?.transactions?.filter((t) => t.type === 'WITHDRAWAL').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-zinc-600">Último Movimiento</span>
                  <span className="text-sm font-medium">
                    {wallet?.transactions?.[0] ? (
                      <ClientDate
                        date={wallet.transactions[0].created_at}
                        formatter={(d) => format(d, 'dd/MM/yyyy')}
                      />
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-50 border-zinc-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info24Regular className="size-5 text-zinc-500 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-700">Información sobre Cobros</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Selecciona las órdenes que deseas cobrar y proporciona tus datos bancarios.
                      Las solicitudes se procesan en 24–48 horas hábiles.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions list */}
          <Card className="md:col-span-2 shadow-sm border-zinc-200 flex flex-col h-full min-h-[500px]">
            <CardHeader className="border-b border-zinc-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History24Regular className="size-5 text-zinc-500" /> Historial de Movimientos
                  </CardTitle>
                  <CardDescription>Tus ingresos y retiros recientes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {['t1', 't2', 't3', 't4', 't5'].map((key) => (
                    <div key={key} className="flex items-center gap-4">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : (wallet?.transactions?.length || 0) === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                  <div className="size-16 rounded-full bg-zinc-50 flex items-center justify-center">
                    <Wallet24Regular className="size-8 opacity-20" />
                  </div>
                  <p className="font-medium">No hay movimientos registrados aún.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {wallet?.transactions?.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-4 p-4 hover:bg-zinc-50/50 transition-colors group"
                    >
                      <TransactionIcon type={tx.type} amount={tx.amount} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                            {tx.description ||
                              (tx.type === 'SALE_PROCEEDS'
                                ? 'Venta de Productos'
                                : 'Retiro de Fondos')}
                          </p>
                          <TransactionBadge type={tx.type} />
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Clock24Regular className="size-3" />
                          <ClientDate
                            date={tx.created_at}
                            formatter={(d) =>
                              format(d, "d 'de' MMMM, yyyy - HH:mm", { locale: es })
                            }
                          />
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold tabular-nums ${tx.amount >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}
                        >
                          {tx.amount >= 0 ? '+' : ''}
                          {fmtMXN(tx.amount)}
                        </p>
                        {tx.type === 'WITHDRAWAL' && (
                          <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-tighter">
                            <CheckmarkCircle24Regular className="size-2.5" /> Procesado
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PayoutRequestDialog
        open={isPayoutOpen}
        onOpenChange={(open) => setIsPayoutOpen(open)}
        selectedOrders={selectedOrders}
        selectedTotal={selectedTotal}
        payoutDetails={payoutDetails}
        onPayoutDetailsChange={setPayoutDetails}
        isSubmitting={isSubmitting}
        onSubmit={handlePayout}
      />
    </PageLayout>
  );
}
