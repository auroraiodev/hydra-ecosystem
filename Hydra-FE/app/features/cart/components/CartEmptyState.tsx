'use client';

import Link from 'next/link';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';

export function CartEmptyState() {
  return (
    <div className="bg-vault-bg font-display text-vault-text min-h-screen antialiased relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 right-0 size-[600px] bg-teal/5 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/3 pointer-events-none z-0" />
      <div className="flex flex-col items-center justify-center px-6 py-20 lg:py-32 text-center max-w-lg mx-auto relative z-10">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-teal/10 rounded-full blur-2xl scale-150 animate-pulse" />
          <div className="relative size-24 lg:w-28 lg:h-28 bg-vault-surface rounded-full flex items-center justify-center border border-vault-border shadow-soft">
            <ShoppingCart className="size-10 lg:w-12 lg:h-12 text-vault-text-muted" />
          </div>
        </div>

        <h1 className="text-2xl lg:text-3xl font-semibold text-vault-text mb-3 tracking-tight">
          Tu carrito está vacío
        </h1>
        <p className="text-vault-text-muted mb-8 leading-relaxed">
          Explora nuestra colección y encuentra las cartas que buscas para tu deck.
        </p>

        <FlowButton asChild variant="default" size="lg" className="w-full sm:w-auto">
          <Link href="/" className="flex items-center justify-center gap-2">
            Explorar Productos
            <ArrowRight className="size-4" />
          </Link>
        </FlowButton>
      </div>
    </div>
  );
}
