'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useNavbar } from '../hooks/useNavbar';
import { MobileHeader } from './MobileHeader';
import { MobileMenu } from './MobileMenu';

const WebNavbar = dynamic(() => import('./WebNavbar').then((mod) => mod.WebNavbar), {
  ssr: true,
});

/**
 * SharedNavbar acts as a layout orchestrator for the application's primary navigation.
 * It manages the responsive switch between Desktop (WebNavbar) and Mobile views.
 */
export function SharedNavbar() {
  const {
    settings,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    activeTcgs,
    isAuthenticated,
    user,
    cartItemCount,
    wishlistCount,
    hideNavbar,
    hideMobileHeader,
  } = useNavbar();

  const siteName = settings.site_name || 'Hydra Collectables';

  return (
    <>
      {/* Desktop View */}
      {!hideNavbar && (
        <div className="hidden lg:block">
          <Suspense fallback={null}>
            <WebNavbar />
          </Suspense>
        </div>
      )}

      {/* Mobile Top Header */}
      {!hideMobileHeader && (
        <MobileHeader
          siteName={siteName}
          siteLogo={settings.site_logo}
          isMenuOpen={isMobileMenuOpen}
          onToggleMenu={toggleMobileMenu}
        />
      )}

      {/* Mobile Menu Overlay */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        activeTcgs={activeTcgs}
        isAuthenticated={isAuthenticated}
        user={user}
        cartItemCount={cartItemCount}
        wishlistCount={wishlistCount}
        siteName={siteName}
        siteLogo={settings.site_logo}
      />
    </>
  );
}
