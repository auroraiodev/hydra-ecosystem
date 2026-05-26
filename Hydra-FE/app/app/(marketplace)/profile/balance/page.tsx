'use client';

import { useEffect, useState, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Wallet,
  Banknote,
  ArrowUpCircle,
  ShoppingCart,
  Calendar,
  FileText,
} from 'lucide-react';
import { getWalletData, WalletData, requestWithdrawal } from '@/lib/api/wallet';
import { FlowButton } from '@/features/shared/ui/flow-button';
import {
  MobilePageContainer,
  DesktopPageContainer,
} from '@/features/shared/components/PageContainers';
import { useToastContext } from '@/features/shared/components/ToastProvider';
import { FormattedDate } from '@/features/shared/components/FormattedDate';
import { Modal } from '@/features/shared/ui/Modal';
import { Input } from '@/features/shared/ui/Input';

interface WithdrawState {
  showModal: boolean;
  amount: string;
  details: string;
  isSubmitting: boolean;
}

type WithdrawAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_AMOUNT'; payload: string }
  | { type: 'SET_DETAILS'; payload: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' }
  | { type: 'RESET' };

function withdrawReducer(state: WithdrawState, action: WithdrawAction): WithdrawState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, showModal: true };
    case 'CLOSE':
      return { ...state, showModal: false };
    case 'SET_AMOUNT':
      return { ...state, amount: action.payload };
    case 'SET_DETAILS':
      return { ...state, details: action.payload };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_END':
      return { ...state, isSubmitting: false };
    case 'RESET':
      return { showModal: false, amount: '', details: '', isSubmitting: false };
    default:
      return state;
  }
}

function WithdrawModal({
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
  return (
    <Modal isOpen={show} onClose={onClose} title="Retirar Saldo">
      <div className="gap-y-6 pt-2">
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <p className="text-sm text-blue-700 font-medium">
            Saldo disponible: <span className="font-black">${balance.toLocaleString()}</span>
          </p>
        </div>
        <Input
          label="Monto a retirar"
          placeholder="0.00"
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
        />
        <div className="gap-y-2">
          <label
            htmlFor="withdraw-details-balance"
            className="text-sm font-bold text-zinc-700 ml-1"
          >
            Detalles de destino
          </label>
          <textarea
            id="withdraw-details-balance"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px]"
            placeholder="Ej: CLABE: 0123... Banco: BBVA a nombre de..."
            value={details}
            onChange={(e) => onDetailsChange(e.target.value)}
          />
        </div>
        <div className="bg-amber-50 p-4 rounded-xl flex gap-3">
          <div className="text-amber-500 text-xl shrink-0">âš ï¸</div>
          <p className="text-[11px] text-amber-700">
            Asegúrate de que tus datos sean correctos. Hydra no se hace responsable por
            transferencias a cuentas erróneas proporcionadas por el usuario.
          </p>
        </div>
        <div className="pt-2 flex gap-3">
          <FlowButton variant="outline" className="flex-1 h-12 rounded-xl" onClick={onClose}>
            Cancelar
          </FlowButton>
          <FlowButton className="flex-1 h-12 rounded-xl" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : 'Solicitar Retiro'}
          </FlowButton>
        </div>
      </div>
    </Modal>
  );
}

export default function UserBalancePage() {
  const { back } = useRouter();
  const { success: toastSuccess, error: toastError } = useToastContext();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [withdraw, withdrawDispatch] = useReducer(withdrawReducer, {
    showModal: false,
    amount: '',
    details: '',
    isSubmitting: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setIsLoading(true);
      const data = await getWalletData();
      setWalletData(data);
    } catch (error) {
      console.error('Failed to fetch wallet data', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdraw.amount);
    if (isNaN(amount) || amount <= 0) {
      toastError('Por favor ingresa un monto válido');
      return;
    }
    if (amount > (walletData?.balance || 0)) {
      toastError('Saldo insuficiente');
      return;
    }

    try {
      withdrawDispatch({ type: 'SUBMIT_START' });
      await requestWithdrawal(amount, withdraw.details);
      toastSuccess('Retiro solicitado correctamente');
      withdrawDispatch({ type: 'RESET' });
      fetchData(); // Refresh balance
    } catch (error: unknown) {
      toastError(error instanceof Error ? error.message : 'Error al solicitar retiro');
    } finally {
      withdrawDispatch({ type: 'SUBMIT_END' });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'SALE_PROCEEDS':
        return <ArrowUpCircle className="text-green-500 text-2xl" />;
      case 'WITHDRAWAL':
        return <Banknote className="text-blue-500 text-2xl" />;
      case 'PURCHASE':
        return <ShoppingCart className="text-red-500 text-2xl" />;
      default:
        return <Wallet className="text-zinc-500 text-2xl" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'SALE_PROCEEDS':
        return 'Venta';
      case 'WITHDRAWAL':
        return 'Retiro';
      case 'PURCHASE':
        return 'Compra';
      default:
        return 'Transacción';
    }
  };

  return (
    <>
      <MobilePageContainer>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => back()} className="text-zinc-600">
              <ArrowLeft className="text-xl" />
            </button>
            <h1 className="text-xl font-semibold">Mi Wallet</h1>
          </div>

          <div className="bg-gradient-to-br from-[rgb(var(--banner-blue-end))] to-blue-800 rounded-3xl p-6 text-white mb-8 shadow-xl">
            <p className="text-blue-100 text-sm font-medium mb-1">Saldo disponible</p>
            <h2 className="text-4xl font-semibold mb-6">
              ${walletData?.balance.toLocaleString() || '0.00'}{' '}
              <span className="text-lg font-normal text-blue-100">MXN</span>
            </h2>
            <FlowButton
              onClick={() => withdrawDispatch({ type: 'OPEN' })}
              className="w-full bg-white text-[rgb(var(--banner-blue-end))] border-none hover:bg-blue-50"
            >
              Retirar Saldo
            </FlowButton>
          </div>

          <h3 className="font-semibold text-zinc-900 mb-4">Movimientos recientes</h3>
          <div className="gap-y-3 pb-20">
            {isLoading ? (
              [1, 2, 3].map((num) => (
                <div
                  key={`balance-skeleton-mob-${num}`}
                  className="h-16 bg-zinc-100 animate-pulse rounded-xl"
                />
              ))
            ) : walletData?.transactions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-zinc-200">
                <Wallet className="text-4xl text-zinc-300 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No hay movimientos registrados.</p>
              </div>
            ) : (
              walletData?.transactions.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-4 rounded-xl border border-zinc-100 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-zinc-50 p-2 rounded-lg">{getTransactionIcon(t.type)}</div>
                    <div>
                      <p className="font-bold text-zinc-800 text-sm">
                        {getTransactionLabel(t.type)}
                      </p>
                      <p className="text-xs text-zinc-500 truncate max-w-[150px]">
                        {t.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-black ${t.amount > 0 ? 'text-green-600' : 'text-zinc-800'}`}
                    >
                      {t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      <FormattedDate date={t.created_at} />
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </MobilePageContainer>

      <DesktopPageContainer>
        <div className="max-w-4xl mx-auto py-10 px-4">
          <div className="flex items-center gap-4 mb-10">
            <button
              onClick={() => back()}
              className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-primary transition-all shadow-sm"
            >
              <ArrowLeft className="text-xl" />
            </button>
            <div>
              <h1 className="text-3xl font-semibold text-zinc-900">Mi Wallet</h1>
              <p className="text-zinc-500">Gestiona tus ingresos y retiros</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-[rgb(var(--banner-blue-end))] to-blue-900 rounded-[2rem] p-8 text-white shadow-2xl sticky top-8">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white/10 p-4 rounded-3xl mb-4 backdrop-blur-sm">
                    <Wallet className="text-4xl" />
                  </div>
                  <p className="text-blue-100 font-medium mb-1">Saldo Total</p>
                  <h2 className="text-4xl font-semibold mb-8">
                    ${walletData?.balance.toLocaleString() || '0.00'}
                  </h2>
                  <FlowButton
                    onClick={() => withdrawDispatch({ type: 'OPEN' })}
                    className="w-full bg-white text-[rgb(var(--banner-blue-end))] hover:bg-white/90 border-none h-14 text-lg font-bold rounded-2xl"
                  >
                    Retirar Fondos
                  </FlowButton>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-zinc-50 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900">Historial de Movimientos</h3>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Calendar />
                    <span>Últimos 30 días</span>
                  </div>
                </div>

                <div className="divide-y divide-zinc-50">
                  {isLoading ? (
                    [1, 2, 3, 4].map((num) => (
                      <div
                        key={`balance-skeleton-desk-${num}`}
                        className="p-6 flex items-center gap-4 animate-pulse"
                      >
                        <div className="size-12 bg-zinc-100 rounded-xl" />
                        <div className="flex-1 gap-y-2">
                          <div className="h-4 bg-zinc-100 rounded w-1/4" />
                          <div className="h-3 bg-zinc-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : walletData?.transactions.length === 0 ? (
                    <div className="p-20 text-center">
                      <FileText className="text-5xl text-zinc-200 mx-auto mb-4" />
                      <p className="text-zinc-500 font-medium">
                        Aún no tienes movimientos en tu balance.
                      </p>
                      <p className="text-sm text-zinc-400 mt-1">
                        Tus ganancias por ventas aparecerán aquí.
                      </p>
                    </div>
                  ) : (
                    walletData?.transactions.map((t) => (
                      <div
                        key={t.id}
                        className="p-6 hover:bg-zinc-50/50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-zinc-100 p-3 rounded-2xl">
                            {getTransactionIcon(t.type)}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">{getTransactionLabel(t.type)}</p>
                            <p className="text-sm text-zinc-500">{t.description}</p>
                            <p className="text-[10px] text-zinc-400 mt-1">
                              <FormattedDate
                                date={t.created_at}
                                formatter={(d) => d.toLocaleString()}
                              />
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xl font-black ${t.amount > 0 ? 'text-green-600' : 'text-zinc-800'}`}
                          >
                            {t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString()}
                          </p>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-300">
                            MXN
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DesktopPageContainer>

      <WithdrawModal
        show={withdraw.showModal}
        balance={walletData?.balance || 0}
        amount={withdraw.amount}
        details={withdraw.details}
        isSubmitting={withdraw.isSubmitting}
        onAmountChange={(v) => withdrawDispatch({ type: 'SET_AMOUNT', payload: v })}
        onDetailsChange={(v) => withdrawDispatch({ type: 'SET_DETAILS', payload: v })}
        onSubmit={handleWithdraw}
        onClose={() => withdrawDispatch({ type: 'CLOSE' })}
      />
    </>
  );
}
