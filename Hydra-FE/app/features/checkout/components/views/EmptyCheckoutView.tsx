'use client';

import Link from 'next/link';
import { ShoppingCart, ChevronLeft } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';

export function EmptyCheckoutView() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6">
      <div className="size-20 rounded-2xl bg-vault-surface-low flex items-center justify-center mb-6 border border-vault-border">
        <ShoppingCart className="size-9 text-vault-text-muted" />
      </div>
      <h1 className="text-2xl font-semibold text-vault-text mb-2 text-center text-balance">
        Tu carrito está vacío
      </h1>
      <p className="text-vault-text-muted text-center max-w-sm mb-8 text-balance">
        Agrega productos increíbles a tu colección para continuar con la compra.
      </p>
      <FlowButton asChild className="rounded-xl">
        <Link href="/cart" className="flex items-center gap-2">
          <ChevronLeft className="size-4" /> Volver al Carrito
        </Link>
      </FlowButton>
    </div>
  );
}
