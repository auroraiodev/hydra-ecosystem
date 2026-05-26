'use client';

import { ShieldCheck, ArrowRight } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui';
import { CheckoutButton } from './CheckoutButton';

interface CartMobileActionsProps {
  totalItems: number;
  totalPrice: number;
  finalTotal: number;
  handleCheckout: () => void;
  formatPrice: (price: number) => string;
}

export function CartMobileActions({
  totalItems,
  totalPrice,
  finalTotal,
  handleCheckout,
  formatPrice,
}: CartMobileActionsProps) {
  return (
    <div className="fixed bottom-[72px] left-0 right-0 bg-vault-surface/95 backdrop-blur-xl border-t border-vault-border z-30 lg:hidden">
      <div className="p-5 gap-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-vault-text-muted">Subtotal ({totalItems} productos)</span>
          <span className="font-semibold text-vault-text tabular-nums">
            {formatPrice(totalPrice)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-vault-text-muted font-medium mb-0.5">Total</p>
            <p className="text-2xl font-bold text-teal tabular-nums">{formatPrice(finalTotal)}</p>
          </div>
          <CheckoutButton onClick={handleCheckout} compact className="origin-top">
            <FlowButton
              variant="default"
              size="lg"
              onClick={handleCheckout}
              className="px-8 rounded-xl bg-teal text-white shadow-lg shadow-teal/30"
            >
              <span className="flex items-center gap-2">
                Pagar
                <ArrowRight className="size-4" />
              </span>
            </FlowButton>
          </CheckoutButton>
        </div>
        {/* Trust badge */}
        <div className="flex items-center justify-center gap-1.5 py-2 opacity-60">
          <ShieldCheck className="size-3.5 text-vault-text-muted" />
          <span className="text-[10px] font-semibold text-vault-text-muted uppercase tracking-wider">
            Pago 100% Seguro
          </span>
        </div>
      </div>
    </div>
  );
}
