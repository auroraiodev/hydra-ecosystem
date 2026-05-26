'use client';

import Image from 'next/image';
import { Landmark, Wallet, Check } from 'lucide-react';
import type { PaymentMethodOptionProps } from '../types';

export function PaymentMethodOption({
  id,
  name,
  subtitle,
  isSelected,
  isDisabled,
  onSelect,
}: PaymentMethodOptionProps) {
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelect(id)}
      className={`relative w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left overflow-hidden ${
        isSelected
          ? 'border-teal bg-teal/5 shadow-[0_0_20px_rgba(var(--glow-teal-rgb)/0.1)]'
          : isDisabled
            ? 'border-white/5 bg-white/2 opacity-30 cursor-not-allowed grayscale'
            : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
    >
      {/* Icon */}
      <div
        className={`size-10 flex items-center justify-center rounded-xl shrink-0 transition-all ${
          isSelected ? 'bg-teal/20 shadow-[0_0_15px_rgba(var(--glow-teal-rgb)/0.2)]' : 'bg-black/40'
        }`}
      >
        {id === 'transfer' && (
          <Landmark className={`size-5 ${isSelected ? 'text-teal' : 'text-text-muted'}`} />
        )}
        {id === 'mercadopago' && (
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <Image
              src="/mercado.png"
              alt="Mercado Pago"
              width={24}
              height={24}
              className={`size-6 object-contain ${isDisabled ? 'grayscale opacity-50' : ''}`}
            />
          </div>
        )}
        {id === 'wallet' && (
          <Wallet className={`size-5 ${isSelected ? 'text-teal' : 'text-text-muted'}`} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-black uppercase tracking-tight block ${isSelected ? 'text-teal' : 'text-text-body'}`}
        >
          {name}
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider block mt-1 ${
            isDisabled && id === 'mercadopago' ? 'text-red-400' : 'text-text-muted'
          }`}
        >
          {subtitle}
        </span>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="size-6 bg-teal rounded-full flex items-center justify-center shrink-0 shadow-lg border border-white/20">
          <Check className="size-3.5 text-black" />
        </div>
      )}
    </button>
  );
}
