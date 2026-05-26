'use client';

import { MapPin, Store } from 'lucide-react';
import type { ShippingMethodSelectorProps } from '../types';

export function ShippingMethodSelector({
  shippingMethod,
  setShippingMethod,
}: ShippingMethodSelectorProps) {
  const options = [
    {
      id: 'shipping' as const,
      label: 'Envío a Domicilio',
      description: 'Express 2-3 días',
      icon: MapPin,
    },
    {
      id: 'arrange' as const,
      label: 'Acordar con Vendedor',
      description: 'Coordinar entrega',
      icon: Store,
    },
  ];

  return (
    <div className="flex border-b border-border-subtle">
      {options.map((option, idx) => {
        const Icon = option.icon;
        const isSelected = shippingMethod === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setShippingMethod(option.id)}
            className={`flex-1 flex items-center justify-center gap-3 py-5 px-4 transition-all relative ${
              isSelected
                ? 'bg-teal/10 text-teal'
                : 'text-text-muted hover:bg-white/5 hover:text-text-body'
            } ${idx === 0 ? '' : 'border-l border-white/10'}`}
          >
            <div
              className={`size-9 rounded-xl flex items-center justify-center transition-all ${
                isSelected ? 'bg-teal/20 shadow-[0_0_15px_rgba(var(--glow-teal-rgb)/0.2)]' : 'bg-white/5'
              }`}
            >
              <Icon className="size-5" />
            </div>
            <div className="text-left hidden sm:block relative z-10">
              <p
                className={`text-sm font-black uppercase tracking-tight ${isSelected ? 'text-teal' : ''}`}
              >
                {option.label}
              </p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                {option.description}
              </p>
            </div>
            <div className="text-left sm:hidden relative z-10">
              <p
                className={`text-xs font-black uppercase tracking-tighter ${isSelected ? 'text-teal' : ''}`}
              >
                {option.id === 'shipping' ? 'Domicilio' : 'Vendedor'}
              </p>
            </div>
            {isSelected && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal shadow-[0_0_10px_rgba(var(--glow-teal-rgb)/0.5)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
