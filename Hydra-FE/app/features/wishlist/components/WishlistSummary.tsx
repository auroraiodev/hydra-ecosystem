'use client';

import { ShoppingCart, Heart } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { WISHLIST_TEXT } from '../constants';
import type { WishlistSummaryProps } from '../types';

export function WishlistSummary({ totalItems, onAddAllToCart, isAddingAll }: WishlistSummaryProps) {
  return (
    <div className="bg-vault-surface rounded-2xl border border-white/5 p-6 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-6 tracking-tight">
        {WISHLIST_TEXT.SUMMARY_TITLE}
      </h2>

      <div className="gap-y-4 mb-8">
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-muted font-medium">Productos en tu bóveda</span>
          <span className="font-bold text-white bg-white/5 px-3 py-1 rounded-lg border border-white/10">
            {totalItems}
          </span>
        </div>
      </div>

      <FlowButton
        variant="default"
        size="lg"
        className="w-full mb-6 bg-teal-600 hover:bg-teal-500 text-white border-0 shadow-lg shadow-teal-500/20 h-14 rounded-2xl font-bold"
        onClick={onAddAllToCart}
        disabled={isAddingAll || totalItems === 0}
      >
        <span className="flex items-center justify-center gap-3">
          <ShoppingCart className="size-5" />
          {isAddingAll ? 'Agregando...' : WISHLIST_TEXT.ADD_ALL_TO_CART}
        </span>
      </FlowButton>

      <div className="flex items-center justify-center gap-2 text-text-muted opacity-40 group cursor-default">
        <Heart className="size-4 fill-teal-400 text-teal-400 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          TU {WISHLIST_TEXT.TITLE}
        </span>
      </div>
    </div>
  );
}
