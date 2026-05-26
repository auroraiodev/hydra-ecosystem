import { CreditCard, Wallet, ArrowRight, Receipt, ShieldCheck } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import type { OrderSidebarSummaryProps } from '../types';

export function OrderSidebarSummary({
  order,
  balance,
  isProcessing,
  onPayWithWallet,
  onPayWithMercadoPago,
  formatPrice,
}: OrderSidebarSummaryProps) {
  const total = parseFloat(order.total);
  const subtotal =
    Number(order.subtotal) > 0 ? Number(order.subtotal) : total - (Number(order.shippingCost) || 0);
  const isWalletDisabled = isProcessing || (balance !== null && balance < total);

  return (
    <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden sticky top-6">
      <div className="p-5 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Receipt className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-body">Resumen</h2>
            <p className="text-xs text-text-muted">Detalle de costos</p>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Subtotal</span>
            <span className="font-semibold text-text-body tabular-nums">
              {formatPrice(subtotal)}
            </span>
          </div>
          {order.shippingCost !== undefined && Number(order.shippingCost) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Envío</span>
              <span className="font-semibold text-text-body tabular-nums">
                {formatPrice(order.shippingCost)}
              </span>
            </div>
          )}
          {order.importFee !== undefined && Number(order.importFee) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Tarifa de Importación</span>
              <span className="font-semibold text-text-body tabular-nums">
                {formatPrice(order.importFee)}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-border-subtle pt-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-medium text-text-muted block mb-0.5">
                Total a pagar
              </span>
              <span className="text-3xl font-bold text-primary tracking-tight tabular-nums">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>

        {order.status === 'PENDING' && (
          <div className="flex flex-col gap-y-3 pt-2">
            {order.payment?.paymentMethod === 'transfer' && (
              <FlowButton
                onClick={onPayWithMercadoPago}
                disabled={isProcessing}
                variant="default"
                size="lg"
                className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="size-4" />
                    Pagar con Mercado Pago
                    <ArrowRight className="size-4" />
                  </span>
                )}
              </FlowButton>
            )}

            {order.payment?.paymentMethod !== 'transfer' && (
              <>
                <FlowButton
                  onClick={onPayWithWallet}
                  disabled={isWalletDisabled}
                  variant="default"
                  size="lg"
                  className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Wallet className="size-4" />
                      Pagar con Mi Wallet
                      <ArrowRight className="size-4" />
                    </span>
                  )}
                </FlowButton>

                {balance !== null && balance < total && (
                  <p className="text-xs text-red-600 text-center font-medium">
                    Saldo insuficiente ({formatPrice(balance)})
                  </p>
                )}

                {balance !== null && balance >= total && (
                  <p className="text-xs text-green-600 text-center flex items-center justify-center gap-1 font-medium">
                    <Wallet className="size-3" /> Saldo disponible: {formatPrice(balance)}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <p className="text-center text-[10px] text-text-muted flex items-center justify-center gap-1.5 pt-2">
          <ShieldCheck className="size-3" /> Transacción segura y encriptada
        </p>
      </div>
    </div>
  );
}
