'use client';

import Image from 'next/image';
import { Landmark, Info } from 'lucide-react';
import { useTheme } from '@/features/shared';
import { PaymentMethodOption } from './PaymentMethodOption';
import type { PaymentMethodSelectorProps } from '../types';

export function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  balance,
  finalTotal,
  isMpDisabled,
  MP_MINIMUM_AMOUNT,
}: PaymentMethodSelectorProps) {
  const { theme } = useTheme();

  const methods = [
    {
      id: 'transfer' as const,
      name: 'Transferencia Bancaria',
      subtitle: 'SPEI / CLABE',
    },
    {
      id: 'mercadopago' as const,
      name: 'Mercado Pago',
      subtitle: isMpDisabled ? `Mínimo: $${MP_MINIMUM_AMOUNT} MXN` : 'Tarjeta, OXXO o saldo',
    },
    {
      id: 'wallet' as const,
      name: 'Hydra Wallet',
      subtitle: `Saldo: $${balance?.toLocaleString() ?? '0'}`,
    },
  ].filter((m) => m.id !== 'wallet' || (balance !== null && balance > 0));

  return (
    <div className="gap-y-5">
      <div className="gap-y-2.5">
        {methods.map((method) => {
          const isDisabled =
            (method.id === 'wallet' && (balance === null || balance < finalTotal)) ||
            (method.id === 'mercadopago' && isMpDisabled);
          const isSelected = paymentMethod === method.id;

          return (
            <PaymentMethodOption
              key={method.id}
              id={method.id}
              name={method.name}
              subtitle={method.subtitle}
              isSelected={isSelected}
              isDisabled={isDisabled}
              onSelect={setPaymentMethod}
              theme={theme as 'light' | 'dark'}
            />
          );
        })}
      </div>

      {/* Bank Transfer Details */}
      {paymentMethod === 'transfer' && (
        <div className="rounded-xl border border-teal/30 bg-teal/10 overflow-hidden animate-fade-in-up shadow-[0_0_30px_rgba(var(--glow-teal-rgb)/0.1)]">
          <div className="px-5 py-4 bg-teal/20 border-b border-teal/20 flex items-center gap-3">
            <Landmark className="size-4 text-teal animate-glow-pulse" />
            <h4 className="text-xs font-semibold text-text-body uppercase tracking-widest">
              Datos Bancarios para SPEI
            </h4>
          </div>
          <div className="p-6 gap-y-1 text-sm bg-black/40">
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Banco
              </span>
              <span className="font-black text-text-body uppercase">Santander</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5 gap-4">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider shrink-0">
                CLABE
              </span>
              <span className="font-mono font-black text-teal tracking-widest text-right select-all">
                0140 9060 6265 9674 98
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5 gap-4">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider shrink-0">
                Beneficiario
              </span>
              <span className="font-black text-text-body text-right uppercase tracking-tight">
                Demis Alberto Rincon Martinez
              </span>
            </div>
            <div className="pt-4 flex items-start gap-3 text-[10px] text-teal/80 font-bold uppercase tracking-tight leading-relaxed">
              <Info className="size-4 shrink-0 mt-0.5 text-teal" />
              <p>
                Usa tu número de pedido como referencia. Tu orden será procesada al confirmar el
                pago manualmente por nuestro equipo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mercado Pago Info */}
      {paymentMethod === 'mercadopago' && (
        <div className="bg-surface-low rounded-xl p-4 border border-border-subtle animate-fade-in-up">
          <div className="flex items-center gap-3 mb-3">
            <div className={theme === 'dark' ? 'bg-white rounded-lg p-1' : ''}>
              <Image
                src="/mercado.png"
                alt="Mercado Pago"
                width={28}
                height={28}
                className="size-7 object-contain shrink-0"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-body">Mercado Pago</p>
              <p className="text-xs text-text-muted">Pago seguro</p>
            </div>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Serás redirigido a Mercado Pago para completar tu compra. Puedes pagar con tarjeta,
            efectivo en OXXO o saldo MP.
          </p>
        </div>
      )}
    </div>
  );
}
