'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { useCart } from '@/features/cart';
import { useWishlist } from '@/features/products';
import { usePublicSettings } from '@/features/shared';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { fetchActiveTcgs } from '@/lib/store/slices/gameSlice';
import { fixEncoding } from '@/lib/utils/encoding';

export function useNavbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { activeTcgs } = useAppSelector((state) => state.game);
  const { user, isAuthenticated, logout } = useAuth();
  const { getTotalItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { settings } = usePublicSettings();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const refetchTcgs = useCallback(() => dispatch(fetchActiveTcgs()), [dispatch]);

  useEffect(() => {
    void Promise.resolve().then(() => setMounted(true));
    if (activeTcgs.length === 0) refetchTcgs();
  }, [activeTcgs.length, refetchTcgs]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const cartItemCount = mounted ? getTotalItems() : 0;

  const firstName = user?.first_name ? fixEncoding(user.first_name) : '';
  const lastName = user?.last_name ? fixEncoding(user.last_name) : '';
  const displayName =
    isAuthenticated && user ? `${firstName} ${lastName}`.trim() || 'Usuario' : 'Usuario';
  const userInitials =
    isAuthenticated && user
      ? `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'JD'
      : 'JD';

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isCheckoutPage = pathname === '/checkout';

  const hideNavbar = isAuthPage || isCheckoutPage;
  const hideMobileHeader =
    hideNavbar || pathname === '/cart' || pathname === '/wishlist' || pathname === '/profile';

  return {
    pathname,
    activeTcgs,
    user,
    isAuthenticated,
    logout,
    cartItemCount,
    wishlistCount,
    settings,
    isMobileMenuOpen,
    mounted,
    toggleMobileMenu,
    closeMobileMenu,
    displayName,
    userInitials,
    hideNavbar,
    hideMobileHeader,
    dispatch,
  };
}
