'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { FadeUp } from '@/features/shared/components/Animations';

export function SellerCTA() {
  return (
    <FadeUp>
      <div className="relative overflow-hidden vault-glass-panel rounded-2xl mx-4 lg:mx-0">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal rounded-l-2xl" />
        <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="size-5 text-teal" />
              <span className="text-xs font-semibold text-teal uppercase tracking-wider">
                Centro de Vendedores
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
              Transforma tu colección en ganancias
            </h3>
            <p className="text-sm text-vault-text-muted max-w-md">
              Vende tus cartas singles y colecciones completas. Nos encargamos del almacenamiento,
              fotografía y envío. Comisión fija del 12%.
            </p>
          </div>
          <Link
            href="/sell"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-teal text-teal-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Empezar a vender
            <ArrowRight className="size-4" />
          </Link>
        </div>
        {/* Decorative floating card */}
        <div className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 w-32 h-40 vault-glass-card rounded-lg rotate-6 opacity-40 pointer-events-none" />
      </div>
    </FadeUp>
  );
}
