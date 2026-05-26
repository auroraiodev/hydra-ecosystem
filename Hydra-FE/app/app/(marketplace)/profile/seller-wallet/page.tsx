'use client';

import { useCallback, useEffect, useReducer, useId } from 'react';
import Image from 'next/image';
import {
  Wallet,
  TrendingUp,
  Package,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FormattedDate } from '@/features/shared/components/FormattedDate';
import { useAuth } from '@/features/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/features/shared/ui';
import { Skeleton } from '@/features/shared/ui/skeleton';
import { Badge } from '@/features/shared/ui/badge';
import {
  MobilePageContainer,
  DesktopPageContainer,
} from '@/features/shared/components/PageContainers';
import { useToastContext } from '@/features/shared/components/ToastProvider';
import { getSellerWalletData, requestWithdrawal, type SellerWalletData } from '@/lib/api/wallet';
import { getMyListings, type Listing } from '@/lib/api/listings';

function fmtMXN(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function TransactionBadge({ type }: { type: string }) {
  switch (type) {
    case 'SALE_PROCEEDS':
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shrink-0">Venta</Badge>
      );
    case 'WITHDRAWAL':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 shrink-0">Retiro</Badge>;
    case 'PURCHASE':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 shrink-0">Compra</Badge>;
    case 'ADJUSTMENT':
      return (
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 shrink-0">Ajuste</Badge>
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
    return <ArrowUpRight className="size-4 text-red-500 shrink-0" />;
  return <ArrowDownLeft className="size-4 text-green-500 shrink-0" />;
}

function WithdrawModalSeller({
  show,
  balance,
  amount,
  details,
  isSubmitting,
  onAmountChange,
  onDetailsChange,
  onSubmit,
  onClose,
}: {
  show: boolean;
  balance: number;
  amount: string;
  details: string;
  isSubmitting: boolean;
  onAmountChange: (v: string) => void;
  onDetailsChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 cursor-pointer"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Cerrar modal de retiro"
      />
      <div
        className="relative bg-white rounded-lg border shadow-lg max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-base font-semibold">Retirar Saldo</h2>
          <button
            className="size-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
            onClick={onClose}
          >
            X
          </button>
        </div>
        <div className="p-4 gap-y-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide">
              Saldo Disponible
            </p>
            <p className="text-2xl font-bold text-emerald-700">{fmtMXN(balance)}</p>
          </div>
          <div>
            <label htmlFor="withdraw-amount" className="text-xs text-muted-foreground mb-1 block">
              Monto a retirar (MXN)
            </label>
            <input
              id="withdraw-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="withdraw-details-2"
              className="text-xs text-muted-foreground mb-1 block"
            >
              Detalles de destino
            </label>
            <textarea
              id="withdraw-details-2"
              placeholder="CLABE, banco, titular..."
              value={details}
              onChange={(e) => onDetailsChange(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Asegúrate de que tus datos sean correctos. Hydra no se hace responsable por
            transferencias a cuentas erróneas.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting || !amount}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow disabled:opacity-50 transition-colors flex-1"
            >
              {isSubmitting ? 'Procesando...' : 'Solicitar Retiro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WalletState {
  wallet: SellerWalletData | null;
  listings: Listing[];
  listingsTotal: number;
  isLoading: boolean;
}

interface WithdrawState {
  showWithdrawModal: boolean;
  withdrawAmount: string;
  withdrawDetails: string;
  isSubmitting: boolean;
}

type WalletAction =
  | { type: 'FETCH_START' }
  | {
      type: 'FETCH_SUCCESS';
      payload: { wallet: SellerWalletData; listings: Listing[]; listingsTotal: number };
    }
  | { type: 'FETCH_ERROR' };

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true };
    case 'FETCH_SUCCESS':
      return {
        wallet: action.payload.wallet,
        listings: action.payload.listings,
        listingsTotal: action.payload.listingsTotal,
        isLoading: false,
      };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

type WithdrawAction =
  | { type: 'SET_FIELD'; payload: Partial<WithdrawState> }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' | 'RESET' };

function withdrawReducer(state: WithdrawState, action: WithdrawAction): WithdrawState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, ...action.payload };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_END':
      return { ...state, isSubmitting: false };
    case 'RESET':
      return {
        showWithdrawModal: false,
        withdrawAmount: '',
        withdrawDetails: '',
        isSubmitting: false,
      };
    default:
      return state;
  }
}

function RestrictedSellerAccess() {
  return (
    <>
      <MobilePageContainer>
        <div className="p-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <AlertTriangle className="size-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-amber-800 mb-2">Acceso Restringido</h2>
            <p className="text-sm text-amber-700">Esta sección es solo para vendedores.</p>
          </div>
        </div>
      </MobilePageContainer>
      <DesktopPageContainer>
        <div className="max-w-4xl mx-auto py-20 px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-12 text-center max-w-lg mx-auto">
            <AlertTriangle className="size-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-amber-800 mb-3">Acceso Restringido</h2>
            <p className="text-amber-700">Esta sección es solo para vendedores.</p>
          </div>
        </div>
      </DesktopPageContainer>
    </>
  );
}

function SalesHistoryList({
  transactions,
  isLoading,
  skeletonId,
}: {
  transactions: {
    id: string;
    type: string;
    amount: number;
    description?: string | null;
    created_at: string | Date;
  }[];
  isLoading: boolean;
  skeletonId: string;
}) {
  if (isLoading) {
    return (
      <div className="p-4 gap-y-3">
        {Array.from({ length: 4 }, (_, i) => ({ uid: `${skeletonId}-sales-${i}` })).map((item) => (
          <div key={item.uid} className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="flex-1 gap-y-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Wallet className="size-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Aún no has vendido ningún producto.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
          <TransactionIcon type={tx.type} amount={tx.amount} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{tx.description || 'Producto vendido'}</p>
            <p className="text-xs text-muted-foreground">
              <FormattedDate
                date={tx.created_at}
                formatter={(d) => format(d, 'dd MMM yyyy, HH:mm', { locale: es })}
              />
            </p>
          </div>
          <TransactionBadge type={tx.type} />
          <span className="text-sm font-semibold shrink-0 text-green-600">
            +{fmtMXN(tx.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MobileWalletView({
  isLoading,
  wallet,
  salesTransactions,
  listingsTotal,
  skeletonId,
  onWithdrawClick,
}: {
  isLoading: boolean;
  wallet: SellerWalletData | null;
  salesTransactions: {
    id: string;
    type: string;
    amount: number;
    description?: string | null;
    created_at: string | Date;
  }[];
  listingsTotal: number;
  skeletonId: string;
  onWithdrawClick: () => void;
}) {
  return (
    <MobilePageContainer>
      <div className="p-4 gap-y-4 pb-24">
        <div>
          <h1 className="text-xl font-semibold">Mis Ventas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tus productos vendidos, inventario y saldo disponible.
          </p>
        </div>

        {/* Balance card */}
        <Card className="border-emerald-200 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide">
                Saldo Disponible
              </p>
              <Wallet className="size-5 text-emerald-400" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-36 mb-3" />
            ) : (
              <p className="text-3xl font-bold text-emerald-700 mb-4">
                {fmtMXN(wallet?.balance || 0)}
              </p>
            )}
            <button
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow disabled:opacity-50 transition-colors w-full"
              onClick={onWithdrawClick}
              disabled={isLoading || !wallet?.balance || wallet.balance <= 0}
            >
              <ArrowUpRight className="mr-2 size-4" />
              Retirar Saldo
            </button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Ventas Totales</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                {isLoading ? '—' : salesTransactions.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Inventario</p>
              <p className="text-xl font-bold text-blue-600 mt-1">
                {isLoading ? '—' : listingsTotal}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sales history */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              Historial de Ventas
            </CardTitle>
            <CardDescription>Productos que has vendido</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <SalesHistoryList
              transactions={salesTransactions}
              isLoading={isLoading}
              skeletonId={skeletonId}
            />
          </CardContent>
        </Card>
      </div>
    </MobilePageContainer>
  );
}

function DesktopWalletView({
  isLoading,
  wallet,
  salesTransactions,
  listingsTotal,
  listings,
  skeletonId,
  onWithdrawClick,
}: {
  isLoading: boolean;
  wallet: SellerWalletData | null;
  salesTransactions: {
    id: string;
    type: string;
    amount: number;
    description?: string | null;
    created_at: string | Date;
  }[];
  listingsTotal: number;
  listings: Listing[];
  skeletonId: string;
  onWithdrawClick: () => void;
}) {
  return (
    <DesktopPageContainer>
      <div className="max-w-5xl mx-auto py-10 px-4">
        {/* Page header matching admin style */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Mis Ventas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Productos vendidos, inventario y saldo disponible.
          </p>
        </div>

        {/* Summary cards (admin style) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Disponible</p>
                  <p
                    className={`text-2xl font-bold ${(wallet?.balance || 0) > 0 ? 'text-emerald-600' : ''}`}
                  >
                    {isLoading ? '—' : fmtMXN(wallet?.balance || 0)}
                  </p>
                </div>
                <Wallet className="size-8 text-emerald-400" />
              </div>
              <button
                className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow disabled:opacity-50 transition-colors w-full"
                onClick={onWithdrawClick}
                disabled={isLoading || !wallet?.balance || wallet.balance <= 0}
              >
                <ArrowUpRight className="mr-2 size-4" />
                Retirar Saldo
              </button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ventas Totales</p>
                  <p className="text-2xl font-bold text-green-600">
                    {isLoading ? '—' : salesTransactions.length}
                  </p>
                </div>
                <TrendingUp className="size-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inventario</p>
                  <p className="text-2xl font-bold">{isLoading ? '—' : listingsTotal}</p>
                </div>
                <Package className="size-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory quick view + Sales history side by side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - inventory */}
          <div className="md:col-span-1 gap-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="size-4 text-muted-foreground" />
                  Productos en Venta
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="gap-y-2">
                    {Array.from({ length: 4 }, (_, i) => ({ uid: `${skeletonId}-inv-${i}` })).map(
                      (item) => (
                        <Skeleton key={item.uid} className="h-8 w-full rounded-md" />
                      )
                    )}
                  </div>
                ) : listings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tienes productos en venta.
                  </p>
                ) : (
                  <div className="gap-y-2">
                    {listings.slice(0, 6).map((listing) => {
                      const img = listing.singles?.img;
                      const name = listing.singles?.cardName || 'Producto';
                      return (
                        <div
                          key={listing.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30"
                        >
                          {img ? (
                            <Image
                              src={img}
                              alt={name}
                              width={32}
                              height={32}
                              className="size-8 rounded object-contain bg-white shrink-0"
                            />
                          ) : (
                            <div className="size-8 rounded bg-muted flex items-center justify-center shrink-0">
                              <Package className="size-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="text-xs font-medium truncate text-foreground">
                            {name}
                          </span>
                        </div>
                      );
                    })}
                    {listings.length > 6 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{listings.length - 6} productos más
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Última Venta
                </p>
                <p className="text-base font-bold">
                  {salesTransactions[0] ? (
                    <FormattedDate
                      date={salesTransactions[0].created_at}
                      formatter={(d) => format(d, 'dd/MM/yyyy')}
                    />
                  ) : (
                    '—'
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right column - sales history */}
          <Card className="md:col-span-2 flex flex-col h-full min-h-[400px]">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="size-4 text-muted-foreground" />
                    Historial de Ventas
                  </CardTitle>
                  <CardDescription>Productos que has vendido</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              {isLoading ? (
                <div className="p-4 gap-y-3">
                  {Array.from({ length: 5 }, (_, i) => ({ uid: `${skeletonId}-hist-${i}` })).map(
                    (item) => (
                      <div key={item.uid} className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-full shrink-0" />
                        <div className="flex-1 gap-y-1">
                          <Skeleton className="h-3 w-40" />
                          <Skeleton className="h-2 w-24" />
                        </div>
                        <Skeleton className="h-5 w-20" />
                      </div>
                    )
                  )}
                </div>
              ) : salesTransactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Wallet className="size-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Aún no has vendido ningún producto.</p>
                  <p className="text-xs mt-1">Cuando realices una venta, aparecerá aquí.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {salesTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <TransactionIcon type={tx.type} amount={tx.amount} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-foreground">
                          {tx.description || 'Producto vendido'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Clock className="size-3 inline mr-1 align-text-bottom" />
                          <FormattedDate
                            date={tx.created_at}
                            formatter={(d) =>
                              format(d, "d 'de' MMMM, yyyy - HH:mm", { locale: es })
                            }
                          />
                        </p>
                      </div>
                      <TransactionBadge type={tx.type} />
                      <span className="text-sm font-semibold shrink-0 text-green-600">
                        +{fmtMXN(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DesktopPageContainer>
  );
}

export default function SellerWalletPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToastContext();
  const [walletState, walletDispatch] = useReducer(walletReducer, {
    wallet: null,
    listings: [],
    listingsTotal: 0,
    isLoading: true,
  });
  const { wallet, listings, listingsTotal, isLoading } = walletState;

  const [withdrawState, withdrawDispatch] = useReducer(withdrawReducer, {
    showWithdrawModal: false,
    withdrawAmount: '',
    withdrawDetails: '',
    isSubmitting: false,
  });
  const { showWithdrawModal, withdrawAmount, withdrawDetails, isSubmitting } = withdrawState;

  const skeletonId = useId();
  const isSeller = user?.role?.name?.toLowerCase() === 'seller';

  const fetchData = useCallback(async () => {
    try {
      walletDispatch({ type: 'FETCH_START' });
      const [walletData, listingsData] = await Promise.all([
        getSellerWalletData(),
        getMyListings(1, 50),
      ]);
      walletDispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          wallet: walletData as SellerWalletData,
          listings: listingsData.data || [],
          listingsTotal: listingsData.total || 0,
        },
      });
    } catch {
      toastError('No se pudo cargar la información');
      walletDispatch({ type: 'FETCH_ERROR' });
    }
  }, [toastError]);

  const handlePageLoad = useCallback(() => {
    if (isSeller) {
      void fetchData();
    }
  }, [isSeller, fetchData]);

  useEffect(() => {
    handlePageLoad();
  }, [handlePageLoad]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toastError('Ingresa un monto válido');
      return;
    }
    if (amount > (wallet?.balance || 0)) {
      toastError('Saldo insuficiente');
      return;
    }
    withdrawDispatch({ type: 'SUBMIT_START' });
    try {
      await requestWithdrawal(amount, withdrawDetails);
      toastSuccess('Retiro solicitado correctamente');
      withdrawDispatch({ type: 'RESET' });
      void fetchData();
    } catch {
      toastError('Error al solicitar retiro');
      withdrawDispatch({ type: 'SUBMIT_END' });
    }
  };

  if (!isSeller) {
    return <RestrictedSellerAccess />;
  }

  const salesTransactions = wallet?.transactions?.filter((t) => t.type === 'SALE_PROCEEDS') || [];

  return (
    <>
      <MobileWalletView
        isLoading={isLoading}
        wallet={wallet}
        salesTransactions={salesTransactions}
        listingsTotal={listingsTotal}
        skeletonId={skeletonId}
        onWithdrawClick={() =>
          withdrawDispatch({ type: 'SET_FIELD', payload: { showWithdrawModal: true } })
        }
      />
      <DesktopWalletView
        isLoading={isLoading}
        wallet={wallet}
        salesTransactions={salesTransactions}
        listingsTotal={listingsTotal}
        listings={listings}
        skeletonId={skeletonId}
        onWithdrawClick={() =>
          withdrawDispatch({ type: 'SET_FIELD', payload: { showWithdrawModal: true } })
        }
      />
      <WithdrawModalSeller
        show={showWithdrawModal}
        balance={wallet?.balance || 0}
        amount={withdrawAmount}
        details={withdrawDetails}
        isSubmitting={isSubmitting}
        onAmountChange={(v) =>
          withdrawDispatch({ type: 'SET_FIELD', payload: { withdrawAmount: v } })
        }
        onDetailsChange={(v) =>
          withdrawDispatch({ type: 'SET_FIELD', payload: { withdrawDetails: v } })
        }
        onSubmit={handleWithdraw}
        onClose={() =>
          withdrawDispatch({ type: 'SET_FIELD', payload: { showWithdrawModal: false } })
        }
      />
    </>
  );
}
