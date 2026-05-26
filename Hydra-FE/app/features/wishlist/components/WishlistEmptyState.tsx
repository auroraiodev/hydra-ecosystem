'use client';

import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { WISHLIST_TEXT } from '../constants';

export function WishlistEmptyState() {
  return (
    <div className="bg-vault-bg font-display text-text-body min-h-[60vh] antialiased">
      <div className="flex flex-col items-center justify-center px-6 py-20 lg:py-32 text-center max-w-lg mx-auto">
        {/* Icon */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-3xl scale-150 animate-pulse" />
          <div className="relative size-28 lg:w-32 lg:h-32 bg-vault-surface rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
            <Heart className="size-12 lg:w-14 lg:h-14 text-teal-400 opacity-40" />
          </div>
        </div>

        <h1 className="text-3xl lg:text-4xl font-semibold text-white mb-4 tracking-tight drop-shadow-sm">
          {WISHLIST_TEXT.EMPTY_TITLE}
        </h1>
        <p className="text-text-muted mb-10 leading-relaxed font-medium text-lg">
          {WISHLIST_TEXT.EMPTY_DESCRIPTION}
        </p>

        <FlowButton
          asChild
          variant="default"
          size="lg"
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white border-0 shadow-xl shadow-teal-500/20 px-10 h-14 rounded-2xl font-bold"
        >
          <Link href="/" className="flex items-center justify-center gap-3">
            {WISHLIST_TEXT.EXPLORE_BUTTON}
            <ArrowRight className="size-5" />
          </Link>
        </FlowButton>
      </div>
    </div>
  );
}
