'use client';

import { useState, useRef, useReducer } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClientDate } from '@/components/ClientDate';
import { useAuth } from '@/hooks/use-auth';
import {
  Search24Regular,
  ArrowUpRight24Regular,
  ArrowDownLeft24Regular,
  Wallet24Regular,
  Add24Regular,
  Subtract24Regular,
  People24Regular,
  EyeOff24Regular,
  Eye24Regular,
} from '@fluentui/react-icons';
import { toast } from 'sonner';

interface UserWalletSummary {
  id: string;
  name: string;
  email: string;
  balance: number;
  transactionCount: number;
}

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface UserWalletDetail {
  id: string;
  name: string;
  email: string;
  balance: number;
  transactions: WalletTransaction[];
}

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
    return <ArrowUpRight24Regular className="size-4 text-red-500 shrink-0" />;
  return <ArrowDownLeft24Regular className="size-4 text-green-500 shrink-0" />;
}

// ─── Access Code Dialog ───────────────────────────────────────────────────────

function AccessCodeDialog({
  open,
  onVerified,
  onClose,
}: {
  open: boolean;
  onVerified: (code: string) => void;
  onClose: () => void;
}) {
  type AccessCodeState = { code: string; show: boolean; loading: boolean };
  const [state, dispatch] = useReducer(
    (s: AccessCodeState, a: Partial<AccessCodeState>) => ({
      ...s,
      ...a,
    }),
    { code: '', show: false, loading: false }
  );
  const { code, show, loading } = state;
  const inputRef = useRef<HTMLInputElement>(null);



  const verify = async () => {
    if (!code.trim()) return;
    dispatch({ loading: true });
    try {
      const res = await fetch('/api/proxy/admin/wallet/verify-access', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (!res.ok) {
        toast.error('Código incorrecto');
        dispatch({ code: '' });
        return;
      }
      onVerified(code.trim());
    } catch {
      toast.error('Error al verificar el código');
    } finally {
      dispatch({ loading: false });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Verificación de acceso</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Ingresa el código de autorización para continuar.
          </p>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Input
              ref={inputRef}
              type={show ? 'text' : 'password'}
              placeholder="Código de acceso"
              value={code}
              onChange={(e) => dispatch({ code: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => dispatch({ show: !show })}
            >
              {show ? <EyeOff24Regular className="size-4" /> : <Eye24Regular className="size-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={verify} disabled={loading || !code.trim()}>
              {loading ? 'Verificando...' : 'Continuar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Adjust Balance Dialog ────────────────────────────────────────────────────

function AdjustDialog({
  open,
  user,
  verifiedCode,
  onClose,
  onSuccess,
}: {
  open: boolean;
  user: UserWalletDetail | null | undefined;
  verifiedCode: string;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}) {
  type AdjustState = { mode: string; amount: string; description: string; loading: boolean };
  const [state, dispatch] = useReducer(
    (s: AdjustState, a: Partial<AdjustState>) => ({ ...s, ...a }),
    { mode: 'add', amount: '', description: '', loading: false }
  );
  const { mode, amount, description, loading } = state;



  // For "set" mode compute the effective delta to show preview
  const preview = (() => {
    const num = parseFloat(amount);
    if (!num || num < 0) return null;
    if (mode === 'add') return { delta: num, result: (user?.balance ?? 0) + num };
    if (mode === 'subtract') return { delta: -num, result: (user?.balance ?? 0) - num };
    // set mode
    const delta = num - (user?.balance ?? 0);
    return { delta, result: num };
  })();

  const submit = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (mode !== 'set' && num === 0) {
      toast.error('Ingresa un monto mayor a cero');
      return;
    }
    if (!description.trim()) {
      toast.error('Ingresa una descripción');
      return;
    }

    // For "set", compute delta against current balance
    let sendAmount: number;
    let isCredit: boolean;
    if (mode === 'set') {
      const delta = num - (user?.balance ?? 0);
      if (delta === 0) {
        toast.error('El saldo ya es ese valor');
        return;
      }
      sendAmount = Math.abs(delta);
      isCredit = delta > 0;
    } else {
      sendAmount = num;
      isCredit = mode === 'add';
    }

    dispatch({ loading: true });
    try {
      const res = await fetch(`/api/proxy/admin/wallet/users/${user!.id}/adjust`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: sendAmount,
          description: description.trim(),
          isCredit,
          code: verifiedCode,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.message || 'Error al ajustar el saldo');
        return;
      }
      const data = await res.json();
      const body = data.data || data;
      toast.success('Saldo actualizado correctamente');
      onSuccess(Number(body.newBalance));
    } catch {
      toast.error('Error al ajustar el saldo');
    } finally {
      dispatch({ loading: false });
    }
  };

  const modeColor =
    mode === 'add'
      ? 'bg-green-50 text-green-700'
      : mode === 'subtract'
        ? 'bg-red-50 text-red-700'
        : 'bg-blue-50 text-blue-700';

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar saldo</DialogTitle>
        </DialogHeader>

        {/* User info + current balance banner */}
        {user && (
          <div className="rounded-lg bg-muted/50 border px-4 py-3 flex items-center justify-between -mt-1 mb-1">
            <div>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Saldo actual</p>
              <p className="text-base font-bold text-emerald-600">{fmtMXN(user.balance)}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Mode selector */}
          <div className="flex rounded-lg border overflow-hidden text-xs">
            <button
              className={`flex-1 py-2 font-medium flex items-center justify-center gap-1 transition-colors ${mode === 'add' ? 'bg-green-600 text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              onClick={() => dispatch({ mode: 'add' })}
            >
              <Add24Regular className="size-3.5" /> Agregar
            </button>
            <button
              className={`flex-1 py-2 font-medium flex items-center justify-center gap-1 transition-colors ${mode === 'subtract' ? 'bg-red-500 text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              onClick={() => dispatch({ mode: 'subtract' })}
            >
              <Subtract24Regular className="size-3.5" /> Reducir
            </button>
            <button
              className={`flex-1 py-2 font-medium flex items-center justify-center gap-1 transition-colors ${mode === 'set' ? 'bg-blue-600 text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              onClick={() => dispatch({ mode: 'set' })}
            >
              <Wallet24Regular className="size-3.5" /> Establecer
            </button>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {mode === 'set' ? 'Nuevo saldo (MXN)' : 'Monto (MXN)'}
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => dispatch({ amount: e.target.value })}
            />
          </div>

          <div>
            <label
              htmlFor="wallet-description"
              className="text-xs text-muted-foreground mb-1 block"
            >
              Descripción / Motivo
            </label>
            <Input
              id="wallet-description"
              placeholder="Ej: Ajuste por devolución"
              value={description}
              onChange={(e) => dispatch({ description: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && void submit()}
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className={`rounded-lg p-3 text-sm font-medium ${modeColor}`}>
              {mode === 'set' ? (
                <>
                  Saldo resultante: <strong>{fmtMXN(preview.result)}</strong>
                </>
              ) : (
                <>
                  {mode === 'add' ? '+' : '-'}
                  {fmtMXN(Math.abs(preview.delta))} →{' '}
                  <strong>{fmtMXN(Math.max(0, preview.result))}</strong>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={submit}
              disabled={loading || !amount || !description.trim()}
            >
              {loading ? 'Aplicando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payout Confirmation Dialog ───────────────────────────────────────────────

function PayoutConfirmDialog({
  open,
  user,
  verifiedCode,
  onClose,
  onSuccess,
}: {
  open: boolean;
  user: UserWalletDetail | null | undefined;
  verifiedCode: string;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}) {
  const [loading, setLoading] = useState(false);

  const confirmPayout = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/admin/wallet/users/${user.id}/payout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verifiedCode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.message || 'Error al procesar el pago');
        return;
      }
      toast.success('Saldo pagado correctamente');
      onSuccess(0);
    } catch {
      toast.error('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirmar pago de saldo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Estás a punto de marcar el saldo de <strong>{user?.name}</strong> como pagado.
          </p>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg text-center">
            <p className="text-xs text-emerald-700 uppercase font-medium">Monto a pagar</p>
            <p className="text-2xl font-bold text-emerald-700">{fmtMXN(user?.balance ?? 0)}</p>
          </div>
          <p className="text-xs text-muted-foreground italic text-center">
            Esta acción registrará un retiro por el total y dejará la cuenta en $0.00.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              onClick={confirmPayout}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Confirmar Pago'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── User Wallet Detail Dialog ────────────────────────────────────────────────

function useWalletDetail(userId: string | null, open: boolean) {
  const { data: wallet, isLoading: loading } = useSWR<UserWalletDetail | null>(
    open && userId ? `/admin/wallet/users/${userId}` : null,
    async (url: string) => {
      const r = await fetch(`/api/proxy${url}`, {
        credentials: 'include',
      });
      if (!r.ok) throw new Error('Failed to load wallet');
      const d = await r.json();
      return d.data || d;
    }
  );

  return { wallet, loading };
}

function useWalletUsers() {
  const { data: users = [], isLoading, mutate } = useSWR<UserWalletSummary[]>(
    '/admin/wallet/users',
    async (url: string) => {
      const r = await fetch(`/api/proxy${url}`, {
        credentials: 'include',
      });
      if (!r.ok) throw new Error('Failed to load wallets');
      const d = await r.json();
      return Array.isArray(d.data || d) ? d.data || d : [];
    }
  );

  return { users, isLoading, mutate };
}

function UserWalletDialog({
  userId,
  open,
  onClose,
  isSelf,
  onBalanceUpdated,
}: {
  userId: string | null;
  open: boolean;
  onClose: () => void;
  isSelf: boolean;
  onBalanceUpdated: (userId: string, newBalance: number) => void;
}) {
  const { wallet, loading } = useWalletDetail(userId, open);
  type DetailState = { showAccessCode: boolean; verifiedCode: string; showAdjust: boolean; showPayout: boolean; pendingAction: string | null };
  const [state, dispatch] = useReducer(
    (s: DetailState, a: Partial<DetailState>) => ({ ...s, ...a }),
    { showAccessCode: false, verifiedCode: '', showAdjust: false, showPayout: false, pendingAction: null }
  );
  const { showAccessCode, verifiedCode, showAdjust, showPayout, pendingAction } = state;

  const handleVerified = (code: string) => {
    dispatch({
      verifiedCode: code,
      showAccessCode: false,
      showPayout: pendingAction === 'payout',
      showAdjust: pendingAction !== 'payout',
    });
  };

  const handleActionSuccess = (newBalance: number) => {
    dispatch({
      showAdjust: false,
      showPayout: false,
      verifiedCode: '',
      pendingAction: null,
    });
    if (wallet) {
      // Notify the parent list to update this user's balance
      onBalanceUpdated(wallet.id, newBalance);
      // Reload the full wallet detail (transactions + fresh balance)
      fetch(`/api/proxy/admin/wallet/users/${wallet.id}`, {
        credentials: 'include',
      })
        .then((r) => r.json())
        .then(() => {
          toast.success('Información actualizada');
        })
        .catch(() => { });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet24Regular className="size-4" />
              {loading ? 'Cargando...' : (wallet?.name ?? '—')}
            </DialogTitle>
            {wallet && <p className="text-xs text-muted-foreground">{wallet.email}</p>}
          </DialogHeader>

          {loading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              {['sk1', 'sk2', 'sk3', 'sk4'].map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : wallet ? (
            <div className="flex flex-col gap-4 overflow-hidden flex-1">
              {/* Balance + adjust button */}
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide">
                    Saldo Actual
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">{fmtMXN(wallet.balance)}</p>
                </div>
                {isSelf ? (
                  <span className="text-xs text-muted-foreground italic">Tu cuenta</span>
                ) : (
                  <div className="flex gap-2">
                    {wallet.balance > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-emerald-600 text-white border-0 hover:bg-emerald-700"
                        onClick={() => {
                          dispatch({ pendingAction: 'payout', showAccessCode: true });
                        }}
                      >
                        Pagar saldo
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                      onClick={() => {
                        dispatch({ pendingAction: 'adjust', showAccessCode: true });
                      }}
                    >
                      Ajustar
                    </Button>
                  </div>
                )}
              </div>

              {/* Transaction list */}
              <div className="flex flex-col overflow-hidden flex-1">
                <p className="text-sm font-medium mb-2">
                  Historial ({wallet.transactions.length} movimientos)
                </p>
                <div className="overflow-y-auto divide-y divide-border border rounded-lg flex-1">
                  {wallet.transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">
                      Sin movimientos.
                    </p>
                  ) : (
                    wallet.transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5">
                        <TransactionIcon type={tx.type} amount={tx.amount} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {tx.description || tx.type}
                          </p>
<p className="text-xs text-muted-foreground" suppressHydrationWarning>
                             <ClientDate date={tx.created_at} formatter={(d) => format(d, 'dd MMM yyyy, HH:mm', { locale: es })} />
                           </p>
                        </div>
                        <TransactionBadge type={tx.type} />
                        <span
                          className={`text-sm font-semibold shrink-0 ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {tx.amount >= 0 ? '+' : ''}
                          {fmtMXN(tx.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AccessCodeDialog
        key={`access-code-${showAccessCode ? 'open' : 'closed'}`}
        open={showAccessCode}
        onVerified={handleVerified}
        onClose={() => dispatch({ showAccessCode: false })}
      />

      <AdjustDialog
        key={`adjust-${showAdjust ? 'open' : 'closed'}`}
        open={showAdjust}
        user={wallet}
        verifiedCode={verifiedCode}
        onClose={() => {
          dispatch({ showAdjust: false, verifiedCode: '', pendingAction: null });
        }}
        onSuccess={handleActionSuccess}
      />

      <PayoutConfirmDialog
        key={`payout-${showPayout ? 'open' : 'closed'}`}
        open={showPayout}
        user={wallet}
        verifiedCode={verifiedCode}
        onClose={() => {
          dispatch({ showPayout: false, verifiedCode: '', pendingAction: null });
        }}
        onSuccess={handleActionSuccess}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const { users, isLoading, mutate } = useWalletUsers();
  const { user: authUser } = useAuth();
  type WalletPageState = { search: string; selectedUserId: string | null; currentUserId: string | null };
  const [state, dispatch] = useReducer(
    (s: WalletPageState, a: Partial<WalletPageState>) => ({ ...s, ...a }),
    {
      search: '',
      selectedUserId: null,
      currentUserId: authUser?.id ?? null,
    }
  );

  const { search, selectedUserId, currentUserId } = state;

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = users.reduce((acc, u) => acc + u.balance, 0);

  return (
    <PageLayout>
      <PageHeader
        title="Wallets de Usuarios"
        description="Gestiona los saldos y movimientos de los usuarios."
      />

      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuarios con saldo</p>
                  <p className="text-2xl font-bold">{isLoading ? '—' : users.length}</p>
                </div>
                <People24Regular className="size-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo total en circulación</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {isLoading ? '—' : fmtMXN(totalBalance)}
                  </p>
                </div>
                <Wallet24Regular className="size-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo promedio</p>
                  <p className="text-2xl font-bold">
                    {isLoading || users.length === 0 ? '—' : fmtMXN(totalBalance / users.length)}
                  </p>
                </div>
                <ArrowDownLeft24Regular className="size-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o correo…"
            className="pl-9"
            value={search}
            onChange={(e) => dispatch({ search: e.target.value })}
          />
        </div>

        {/* User wallet cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
              {search ? ' encontrados' : ' con wallet'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {['sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'sk6'].map((k) => (
                  <div key={k} className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {search
                  ? 'Sin resultados para esa búsqueda.'
                  : 'No hay usuarios con wallet activo.'}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((u) => (
                  <button
                    key={u.id}
                    className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors text-left ${u.id === currentUserId ? 'bg-muted/30' : ''}`}
                    onClick={() => dispatch({ selectedUserId: u.id })}
                  >
                    {/* Avatar */}
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>

                    {/* Stats */}
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold ${u.balance > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}
                      >
                        {fmtMXN(u.balance)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {u.transactionCount} movimiento{u.transactionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <UserWalletDialog
        userId={selectedUserId}
        open={!!selectedUserId}
        onClose={() => dispatch({ selectedUserId: null })}
        isSelf={!!selectedUserId && selectedUserId === currentUserId}
        onBalanceUpdated={() => mutate()}
      />
    </PageLayout>
  );
}
