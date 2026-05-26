'use client';

import { useEffect, useState, useMemo, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { FlowButton } from '@/features/shared/ui';
import { SearchModal } from '@/features/search-filters';
import { QuickViewModal, ProductSection, LandsSection } from '@/features/products/components';
import { SearchInput } from '@/features/shared/ui';
import type { SearchResult } from '@/lib/types';
import { searchLocal } from '@/lib/api';
import { searchResultsToCardData } from '@/lib/utils/transformers';
import type { CardData } from '@/features/products/types';
import type { SinglesLandingClientProps } from '../types';

export function SinglesLandingClient({ initialData }: SinglesLandingClientProps) {
  const { replace } = useRouter();
  interface ResultsData {
    commander: SearchResult[];
    cedhStaple: SearchResult[];
  }

  interface UiState {
    quickViewCard: CardData | null;
    isQuickViewOpen: boolean;
    isSearchModalOpen: boolean;
  }

  type ResultsAction =
    | { type: 'SET_COMMANDER'; payload: SearchResult[] }
    | { type: 'SET_CEDH_STAPLE'; payload: SearchResult[] }
    | { type: 'SET_DATA'; payload: Partial<ResultsData> };

  function resultsReducer(state: ResultsData, action: ResultsAction): ResultsData {
    switch (action.type) {
      case 'SET_COMMANDER':
        return { ...state, commander: action.payload };
      case 'SET_CEDH_STAPLE':
        return { ...state, cedhStaple: action.payload };
      case 'SET_DATA':
        return { ...state, ...action.payload };
      default:
        return state;
    }
  }

  const [resultsData, resultsDispatch] = useReducer(resultsReducer, {
    commander: initialData.commander,
    cedhStaple: initialData.cedhStaple,
  });
  const commanderResults = resultsData.commander;
  const cedhStapleResults = resultsData.cedhStaple;

  const [uiState, setUiState] = useState<UiState>({
    quickViewCard: null,
    isQuickViewOpen: false,
    isSearchModalOpen: false,
  });
  const { quickViewCard, isQuickViewOpen, isSearchModalOpen } = uiState;

  const setQuickViewCard = (card: CardData | null) =>
    setUiState((prev) => ({ ...prev, quickViewCard: card }));
  const setIsQuickViewOpen = (open: boolean) =>
    setUiState((prev) => ({ ...prev, isQuickViewOpen: open }));
  const setIsSearchModalOpen = (open: boolean) =>
    setUiState((prev) => ({ ...prev, isSearchModalOpen: open }));

  const handleQuickView = (card: CardData) => {
    setQuickViewCard(card);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setQuickViewCard(null);
    setIsQuickViewOpen(false);
  };

  // BACKGROUND REFRESH
  useEffect(() => {
    const refreshData = async () => {
      try {
        const [commander, cedhStaple] = await Promise.all([
          searchLocal({ limit: 20, metadata: 'commander' }),
          searchLocal({ limit: 20, metadata: 'cEDH Staple' }),
        ]);

        const filterStock = (data: SearchResult[]) =>
          (data || []).filter((r) => !r.isLocalInventory || r.stock > 0);

        const updated: { commander?: SearchResult[]; cedhStaple?: SearchResult[] } = {};
        if (commander.success) updated.commander = filterStock(commander.data);
        if (cedhStaple.success) updated.cedhStaple = filterStock(cedhStaple.data);

        if (updated.commander !== undefined || updated.cedhStaple !== undefined) {
          resultsDispatch({
            type: 'SET_DATA',
            payload: {
              ...(updated.commander !== undefined ? { commander: updated.commander } : {}),
              ...(updated.cedhStaple !== undefined ? { cedhStaple: updated.cedhStaple } : {}),
            },
          });
        }

        // Data-driven redirect: if no singles products exist, redirect to home
        // This runs after background refresh to handle empty catalog state
        if (commander.data.length === 0 && cedhStaple.data.length === 0) {
          replace('/');
        }
      } catch (err) {
        console.error('Singles background refresh failed:', err);
      }
    };

    const timer = setTimeout(refreshData, 100);
    return () => clearTimeout(timer);
  }, [replace]);

  const commanderCardDataList = useMemo(
    () => searchResultsToCardData(commanderResults, { suffix: 'commander' }),
    [commanderResults]
  );

  const cedhStapleCardDataList = useMemo(
    () => searchResultsToCardData(cedhStapleResults, { suffix: 'cedhStaple' }),
    [cedhStapleResults]
  );

  return (
    <div className="bg-background font-display text-text-body min-h-screen pb-24 lg:pb-0 antialiased selection:bg-primary/20 selection:text-primary animate-page-enter">
      <main className="flex flex-col gap-6 pt-2 lg:pt-0 lg:max-w-7xl lg:mx-auto lg:px-4">
        {/* Search input */}
        <div className="px-4 lg:px-0 lg:mb-4">
          {/* Mobile: opens modal */}
          <div className="lg:hidden">
            <SearchInput
              placeholder="Buscar singles"
              className="w-full"
              variant="large"
              searchType="singles"
              searchRoute="/singles/search"
              readOnly={true}
              onClick={() => setIsSearchModalOpen(true)}
            />
          </div>
          {/* Desktop: inline with suggestions */}
          <div className="hidden lg:block">
            <SearchInput
              placeholder="Buscar singles"
              className="w-full max-w-4xl mx-auto"
              variant="large"
              searchType="singles"
              searchRoute="/singles/search"
            />
          </div>
        </div>

        <ProductSection
          title="Imprescindible para tu commander"
          href="/singles/search?local=true&pagination=true&metadata=commander"
          cards={commanderCardDataList}
          loading={false}
          onQuickView={handleQuickView}
          className="lg:mt-6"
        />

        <ProductSection
          title="cEDH Staple"
          href="/singles/search?local=true&pagination=true&metadata=cEDH Staple"
          cards={cedhStapleCardDataList}
          loading={false}
          onQuickView={handleQuickView}
          className="lg:mt-6"
        />

        <LandsSection className="lg:mt-6" />

        {/* Sell Section CTA */}
        <div className="px-4 lg:px-0 mt-16 mb-8 relative group">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="relative glass-panel rounded-[2rem] p-8 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-10 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
            <div className="max-w-2xl text-center lg:text-left">
              <span className="text-primary font-black tracking-[0.2em] text-xs uppercase mb-4 block">
                Centro de Vendedores
              </span>
              <h2 className="text-3xl lg:text-5xl font-semibold text-text-body mb-6 tracking-tighter leading-tight uppercase">
                ¿Tienes cartas que <br />
                <span className="text-primary">no usas?</span>
              </h2>
              <p className="text-text-muted text-lg font-medium leading-relaxed mb-8 max-w-xl">
                Las vendemos por ti. Envíanos tus singles o colecciones (solo MTG y cierta región
                del país por ahora), las listamos en la tienda y te pagamos una vez que se vendan.
                Comisión fija del 12%, sin sorpresas.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <FlowButton
                  asChild
                  size="lg"
                  variant="default"
                  className="rounded-xl shadow-xl shadow-primary/20"
                >
                  <Link href="/sell">Empezar a Vender</Link>
                </FlowButton>
                <FlowButton asChild size="lg" variant="ghost" className="rounded-xl font-bold">
                  <Link href="/sell">Ver Guía de Precios</Link>
                </FlowButton>
              </div>
            </div>
            <div className="relative size-72 lg:w-[450px] lg:h-[450px] shrink-0 preserve-3d">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
              <div className="relative z-10 size-full flex items-center justify-center group/cards">
                {/* Back card */}
                <div className="w-48 h-64 lg:w-56 lg:h-80 rounded-2xl absolute -rotate-[20deg] -translate-x-12 translate-y-4 shadow-2xl transition-all duration-700 group-hover/cards:-rotate-[25deg] group-hover/cards:-translate-x-16 opacity-40">
                  <NextImage
                    src="/mtg-back-hq.webp"
                    alt="Card Back Decor"
                    fill
                    className="object-cover rounded-2xl grayscale opacity-50 scale-110"
                  />
                </div>
                {/* Middle card */}
                <div className="w-48 h-64 lg:w-56 lg:h-80 rounded-2xl absolute rotate-[8deg] translate-x-10 -translate-y-4 shadow-2xl transition-all duration-700 group-hover/cards:rotate-[15deg] group-hover/cards:translate-x-14 z-10">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent z-20 rounded-2xl mix-blend-overlay"></div>
                  <NextImage
                    src="/mtg-back-hq.webp"
                    alt="MTG Card Back"
                    fill
                    className="object-cover rounded-2xl shadow-inner scale-110"
                  />
                </div>
                {/* Front card */}
                <div className="w-48 h-64 lg:w-56 lg:h-80 rounded-2xl absolute -rotate-[4deg] -translate-x-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center transition-all duration-700 group-hover/cards:-rotate-[2deg] group-hover/cards:scale-105 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-50 z-30"></div>
                  <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 animate-shimmer pointer-events-none z-30"></div>
                  <NextImage
                    src="/mtg-back-hq.webp"
                    alt="Center MTG Card"
                    fill
                    className="object-cover rounded-2xl scale-110"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      <QuickViewModal
        card={quickViewCard}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
      />
    </div>
  );
}
