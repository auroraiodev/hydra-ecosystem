'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MarketplaceContentWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper for marketplace content that dynamically adjusts top padding
 * based on whether the global navigation bar is visible.
 */
export function MarketplaceContentWrapper({ children }: MarketplaceContentWrapperProps) {
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isCheckoutPage = pathname === '/checkout';

  const hideNavbar = isAuthPage || isCheckoutPage;
  const hideMobileHeader =
    hideNavbar || pathname === '/cart' || pathname === '/wishlist' || pathname === '/profile';

  return (
    <div
      className={cn(
        'flex-grow transition-[padding] duration-300',
        !hideMobileHeader && 'pt-14',
        !hideNavbar && 'lg:pt-16'
      )}
    >
      {children}
    </div>
  );
}
