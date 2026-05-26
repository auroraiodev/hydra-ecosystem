'use client';

import { ShieldCheck, ArrowRight } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui';
import { CheckoutButton } from './CheckoutButton';

interface CartSummaryProps {
  totalItems: number;
  totalPrice: number;
  finalTotal: number;
  hasOutOfStock: boolean;
  handleCheckout: () => void;
  formatPrice: (price: number) => string;
}

export function CartSummary({
  totalItems,
  totalPrice,
  finalTotal,
  hasOutOfStock,
  handleCheckout,
  formatPrice,
}: CartSummaryProps) {
  return (
    <div className="bg-vault-surface rounded-xl border border-vault-border p-6 sticky top-6">
      <h2 className="text-lg font-semibold text-vault-text mb-6">Resumen del Pedido</h2>

      <div className="gap-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-vault-text-muted">
            Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
          </span>
          <span className="font-semibold text-vault-text tabular-nums">
            {formatPrice(totalPrice)}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm text-vault-text-muted">
          <span>Envío</span>
          <span className="font-medium text-teal">Se calcula al pagar</span>
        </div>
      </div>

      <div className="border-t border-vault-border pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-vault-text">Total</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-teal tabular-nums">
              {formatPrice(finalTotal)}
            </span>
            <p className="text-[10px] text-vault-text-muted uppercase tracking-wide">MXN</p>
          </div>
        </div>
      </div>

      {hasOutOfStock && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-700">
            Algunos productos en tu carrito están sin stock. Considera cambiar la versión o
            eliminarlos.
          </p>
        </div>
      )}

      <CheckoutButton onClick={handleCheckout}>
        <FlowButton
          variant="default"
          size="lg"
          className="w-full mb-4 bg-teal text-white shadow-lg shadow-teal/30"
          onClick={handleCheckout}
        >
          <span className="flex items-center justify-center gap-2">
            Proceder al Pago
            <ArrowRight className="size-4" />
          </span>
        </FlowButton>
      </CheckoutButton>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-2 text-vault-text-muted">
        <ShieldCheck className="size-4" />
        <span className="text-xs font-medium">Pago seguro y encriptado</span>
      </div>
    </div>
  );
}
