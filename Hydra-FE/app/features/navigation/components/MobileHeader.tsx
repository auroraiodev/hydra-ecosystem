'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { setSelectedTcg } from '@/lib/store/slices/gameSlice';
import { useDispatch } from 'react-redux';

import { resolveImageUrl } from '@/lib/utils/imageUrl';
import type { MobileHeaderProps } from '../types';

export function MobileHeader({ siteName, siteLogo, isMenuOpen, onToggleMenu }: MobileHeaderProps) {
  const dispatch = useDispatch();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 vault-glass-panel border-b border-white/5 px-4 h-14 flex items-center justify-between lg:hidden">
      <Link
        href="/"
        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        onClick={() => dispatch(setSelectedTcg(null))}
      >
        <div className="relative size-8 flex items-center justify-center shrink-0">
          <Image
            src={resolveImageUrl(siteLogo) || '/cat.png'}
            alt={`${siteName} - Tu tienda #1 de Magic México`}
            fill
            sizes="32px"
            priority
            className="object-contain"
          />
        </div>
        <span className="text-base font-bold tracking-tight text-white leading-none">
          {siteName}
        </span>
      </Link>

      <div className="flex items-center gap-1">
        <button
          className="p-2 text-vault-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          onClick={onToggleMenu}
          aria-label={isMenuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
    </div>
  );
}
