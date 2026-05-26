'use client';

import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { PaymentMethodSelector } from '../PaymentMethodSelector';
import { MP_MINIMUM_AMOUNT } from '../../constants';
import type { PaymentMethod } from '../../types';

interface PaymentSectionFlags {
  hideCta: boolean;
  isMpDisabled: boolean;
  hasOutOfStockSelected: boolean;
  isProcessing: boolean;
  isAddingAddress?: boolean;
}

export function PaymentSection({
  flags = {
    hideCta: false,
    isMpDisabled: false,
    hasOutOfStockSelected: false,
    isProcessing: false,
  },
  paymentMethod,
  setPaymentMethod,
  balance,
  finalTotal,
  formatPrice,
  handleCheckoutClick,
  selectedAddressId,
  shippingMethod,
}: {
  flags: PaymentSectionFlags;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
  balance: number | null;
  finalTotal: number;
  formatPrice: (price: string | number) => React.ReactNode;
  handleCheckoutClick: () => void;
  selectedAddressId: string;
  shippingMethod: string;
}) {
  return (
    <div className="bg-vault-surface rounded-2xl border border-vault-border overflow-hidden">
      <div className="p-5 border-b border-vault-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-teal/10 flex items-center justify-center">
              <span className="text-sm font-bold text-teal">3</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-vault-text">Método de Pago</h2>
              <p className="text-xs text-vault-text-muted">Elige cómo pagar tu pedido</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-bold uppercase tracking-wider bg-green-50 dark:bg-green-950/30 px-2.5 py-1.5 rounded-lg border border-green-100 dark:border-green-900">
            <Lock className="size-3" /> Seguro
          </div>
        </div>
      </div>
      <div className="p-5">
        <PaymentMethodSelector
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          balance={balance}
          finalTotal={finalTotal}
          isMpDisabled={flags.isMpDisabled}
          MP_MINIMUM_AMOUNT={MP_MINIMUM_AMOUNT}
        />
      </div>
      {!flags.hideCta && (
        <div className="p-5 border-t border-vault-border bg-vault-surface-low/50">
          <FlowButton
            onClick={handleCheckoutClick}
            disabled={
              flags.isProcessing ||
              (shippingMethod === 'shipping' && !selectedAddressId) ||
              flags.hasOutOfStockSelected
            }
            className="w-full bg-teal text-white rounded-xl h-12 text-sm font-bold shadow-lg shadow-teal/20 hover:shadow-xl hover:shadow-teal/30 transition-all"
          >
            {flags.isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="size-4" />
                Pagar {formatPrice(finalTotal)}
                <ArrowRight className="size-4" />
              </span>
            )}
          </FlowButton>
        </div>
      )}
    </div>
  );
}
