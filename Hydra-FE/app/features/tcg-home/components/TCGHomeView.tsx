'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { TcgCategoryTabs } from '@/features/search-filters';
import { HomeSEOContent } from '@/features/shared/components/HomeSEOContent';
import { FadeUp } from '@/features/shared/components/Animations';
import { type TCGHomeViewProps } from '../types';
import { HeroCarousel } from './HeroCarousel';
import { SellerCTA } from './SellerCTA';
import { SearchInput } from '@/features/shared/ui';
import { useAppDispatch } from '@/lib/store/hooks';
import { setSelectedTcg } from '@/lib/store/slices/gameSlice';
import { TcgHomeSections } from './TcgHomeSections';

export function TCGHomeView({ selectedTcg, activeTcgs, reviews }: TCGHomeViewProps) {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    dispatch(setSelectedTcg(selectedTcg));

    // Clear selection on unmount if needed, but usually we want to keep it
    // for subsequent sub-page loaders
  }, [dispatch, selectedTcg]);

  const pathname = usePathname();
  const tcgName = selectedTcg.display_name || selectedTcg.name || '';
  const searchPlaceholder = `Busca cartas de ${tcgName}, accesorios, bundles ...`;
  const singlesSearchRoute = `${pathname}/singles/search`;

  return (
    <div className="font-display min-h-screen -mt-14 pt-14 pb-24 lg:pb-12 antialiased relative overflow-hidden bg-vault-bg text-white">
      {/* Background glows */}
      <div className="absolute top-0 right-0 size-[900px] bg-teal/5 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute top-[15%] left-0 size-[700px] bg-teal/3 rounded-full blur-[120px] -translate-x-1/3 pointer-events-none z-0" />

      <div className="flex flex-col gap-4 lg:gap-6 pt-4 lg:pt-6 lg:max-w-7xl lg:mx-auto lg:px-4 lg:sm:px-6 relative z-10">
        {/* Breadcrumb */}
        <FadeUp>
          <nav className="px-4 lg:px-0" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-vault-text-muted">
              <li>
                <Link href="/" className="hover:text-teal transition-colors">
                  Inicio
                </Link>
              </li>
              <ChevronRight className="size-3" />
              <li className="text-white font-medium">{tcgName}</li>
            </ol>
          </nav>
        </FadeUp>

        {/* Category Tabs */}
        <FadeUp delay={0.05}>
          <div className="px-4 lg:px-0">
            <TcgCategoryTabs variant="vault" />
          </div>
        </FadeUp>

        {/* Hero */}
        <div className="px-4 lg:px-0">
          <HeroCarousel tcgId={selectedTcg.id} />
        </div>

        {/* Search */}
        <div className="px-4 lg:px-0">
          <div className="lg:max-w-4xl lg:mx-auto">
            <SearchInput
              placeholder={searchPlaceholder}
              className="w-full"
              variant="vault"
              searchType="singles"
              searchRoute={singlesSearchRoute}
            />
          </div>
        </div>

        {/* Dynamic TCG sections */}
        <div className="px-4 lg:px-0">
          <TcgHomeSections tcg={selectedTcg} />
        </div>

        {/* Seller CTA */}
        <SellerCTA />

        {/* SEO */}
        <div className="px-4 lg:px-0">
          <HomeSEOContent reviews={reviews || []} activeTcgs={activeTcgs} />
        </div>
      </div>
    </div>
  );
}
