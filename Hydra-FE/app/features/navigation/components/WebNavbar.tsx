'use client';

import { Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useWebNavbar } from '../hooks/useWebNavbar';
import { NavbarTcgTabs } from './NavbarTcgTabs';
import { UserActions } from './UserActions';
import { TcgCategoryDropdown } from './TcgCategoryDropdown';
import { setSelectedTcg } from '@/lib/store/slices/gameSlice';
import { resolveImageUrl } from '@/lib/utils/imageUrl';

function WebNavbarSearchParams() {
  const searchParams = useSearchParams();
  return <WebNavbarInner searchParams={searchParams} />;
}

function WebNavbarInner({ searchParams }: { searchParams: ReturnType<typeof useSearchParams> }) {
  const {
    user,
    isAuthenticated,
    authLoading,
    cartItemCount,
    wishlistCount,
    settings,
    siteName,
    activeTcgs,
    selectedTcg,
    categories,
    catsLoading,
    catsError,
    openTcgId,
    dropdownPos,
    dropdownRef,
    barRef,
    pathname,
    handleTcgClick,
    handleTcgHover,
    handleCategoryClick,
    setOpenTcgId,
    dispatch,
    mounted,
    activeCategory,
  } = useWebNavbar(searchParams);

  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setOpenTcgId(null);
    }, 200);
  };

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
  };

  return (
    <nav
      ref={barRef}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className="fixed top-0 left-0 right-0 z-50 vault-glass-panel border-b border-white/10 px-6 h-16 flex items-center justify-between shadow-2xl"
      aria-label="Navegación principal"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-vault-surface focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:font-semibold"
      >
        Saltar al contenido principal
      </a>

      {/* Left Section - Logo & Game Tabs */}
      <div className="flex items-center flex-1 min-w-0 relative z-10 gap-6">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-90 transition-all duration-300 relative z-10 group"
          onClick={(e) => {
            dispatch(setSelectedTcg(null));
            e.stopPropagation();
          }}
        >
          <div className="relative size-8 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
            <div className="absolute inset-0 bg-teal/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Image
              src={resolveImageUrl(settings.site_logo) || '/cat.png'}
              alt={`${siteName} - Marketplace de Cartas TCG en México`}
              fill
              sizes="32px"
              priority
              className="object-contain relative z-10"
            />
          </div>
          <span className="text-base font-bold tracking-tighter text-white leading-none relative z-10 hidden md:inline group-hover:text-teal transition-colors">
            {siteName}
          </span>
        </Link>

        <NavbarTcgTabs
          activeTcgs={activeTcgs}
          openTcgId={openTcgId}
          pathname={pathname}
          selectedTcg={selectedTcg}
          onTcgClick={handleTcgClick}
          onTcgHover={handleTcgHover}
          onInicioClick={() => dispatch(setSelectedTcg(null))}
          mounted={mounted}
        />
      </div>

      <UserActions
        authLoading={authLoading}
        isAuthenticated={isAuthenticated}
        user={user}
        cartItemCount={cartItemCount}
        wishlistCount={wishlistCount}
        mounted={mounted}
      />

      {openTcgId && (
        <TcgCategoryDropdown
          dropdownRef={dropdownRef}
          dropdownPos={dropdownPos}
          catsLoading={catsLoading}
          catsError={catsError}
          categories={categories}
          selectedTcg={activeTcgs.find((t) => t.id === openTcgId) || selectedTcg}
          pathname={pathname}
          activeCategory={activeCategory}
          onClose={() => setOpenTcgId(null)}
          onCategoryClick={(cat) => {
            const tcg = activeTcgs.find((t) => t.id === openTcgId);
            if (tcg) handleCategoryClick(cat, tcg);
          }}
        />
      )}
    </nav>
  );
}

export function WebNavbar() {
  return (
    <Suspense fallback={null}>
      <WebNavbarSearchParams />
    </Suspense>
  );
}
