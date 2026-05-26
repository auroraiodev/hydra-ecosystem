'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/features/cart';
import { useAuth } from '@/features/auth';
import { useWishlist } from '@/features/products';

export function useBottomNavigation() {
  const pathname = usePathname();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cartBump, setCartBump] = useState(false);
  const prevCountRef = useRef(0);
  const { items } = useCart();
  const { isAuthenticated } = useAuth();
  const { count: wishlistCount } = useWishlist();

  useEffect(() => {
    void Promise.resolve().then(() => setMounted(true));
  }, []);

  const cartItemCount = mounted ? items.reduce((total, item) => total + item.quantity, 0) : 0;
  const wishlistItemCount = mounted ? wishlistCount : 0;

  useEffect(() => {
    if (mounted && cartItemCount > prevCountRef.current) {
      setCartBump(true);
      const timer = setTimeout(() => setCartBump(false), 500);
      prevCountRef.current = cartItemCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = cartItemCount;
  }, [cartItemCount, mounted]);

  const openSearch = () => setIsSearchModalOpen(true);
  const closeSearch = () => setIsSearchModalOpen(false);

  return {
    pathname,
    isSearchModalOpen,
    mounted,
    cartItemCount,
    wishlistItemCount,
    isAuthenticated,
    cartBump,
    openSearch,
    closeSearch,
  };
}
