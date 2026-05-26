'use client';

import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { SearchModal } from '@/features/search-filters';
import { useBottomNavigation } from '../hooks/useBottomNavigation';
import { BOTTOM_NAV_ITEMS } from '../constants';

/**
 * Mobile-only BottomNavigation component.
 * Refactored to use useBottomNavigation hook for business logic.
 */
export function BottomNavigation() {
  const {
    pathname,
    isSearchModalOpen,
    cartItemCount,
    wishlistItemCount,
    isAuthenticated,
    cartBump,
    openSearch,
    closeSearch,
  } = useBottomNavigation();

  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
      active ? 'text-teal font-semibold' : 'text-vault-text-muted hover:text-white'
    }`;

  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full vault-glass-panel border-t border-white/10 pb-5 pt-3 px-2 flex justify-around items-center z-50 transition-all duration-300 lg:hidden">
        {/* Subtle accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />

        {/* Home */}
        <Link href="/" className={itemClass(pathname === '/')}>
          <Home className="size-6" />
          <span className={`text-[10px] ${pathname === '/' ? 'font-bold' : 'font-medium'}`}>
            Inicio
          </span>
        </Link>

        {/* Search - Opens Modal */}
        <button onClick={openSearch} className={itemClass(false)}>
          <Search className="size-6" />
          <span className="text-[10px] font-medium">Buscar</span>
        </button>

        {/* Other nav items */}
        {BOTTOM_NAV_ITEMS.slice(1).map((item) => {
          const Icon = item.icon;
          const href =
            (item.href === '/profile' || item.href === '/wishlist') && !isAuthenticated
              ? '/login'
              : item.href;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={href} className={itemClass(isActive)}>
              <div className="relative">
                <Icon className={`size-6 ${item.href === '/cart' && cartBump ? 'cart-bump' : ''}`} />
                {item.href === '/cart' && cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-teal text-white text-[10px] font-bold rounded-full min-size-[18px] flex items-center justify-center px-1 border-2 border-vault-bg">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
                {item.href === '/wishlist' && wishlistItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-teal text-white text-[10px] font-bold rounded-full min-size-[18px] flex items-center justify-center px-1 border-2 border-vault-bg">
                    {wishlistItemCount > 99 ? '99+' : wishlistItemCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <SearchModal isOpen={isSearchModalOpen} onClose={closeSearch} />
    </>
  );
}
