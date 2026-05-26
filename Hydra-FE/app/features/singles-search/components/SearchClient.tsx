'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SearchModal } from '@/features/search-filters';
import type { CardData } from '@/features/products/types';
import { computeFinalHref } from '@/features/products/utils';
import { normalizePrice, resolveLanguageName } from '@/lib/utils/transformers';
import { useSinglesSearch } from '../hooks/useSinglesSearch';
import { getCategoryDisplay } from '../utils';
import type { SinglesSearchProps } from '../types';

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setSelectedTcg } from '@/lib/store/slices/gameSlice';
import { SearchBreadcrumbs } from './SearchBreadcrumbs';
import { SearchMobileResults } from './SearchMobileResults';
import { SearchDesktopResults } from './SearchDesktopResults';
import type { HybridSearchResult } from '../types';

const EMPTY_RESULTS: HybridSearchResult[] = [];
const EMPTY_PAGINATION = null;

export function SearchClient({
  forcedExpansion,
  category,
  tcgId,
  tcgSlug,
  initialResults = EMPTY_RESULTS,
  initialPagination = EMPTY_PAGINATION,
}: SinglesSearchProps) {
  return (
    <Suspense fallback={null}>
      <SearchClientInner
        forcedExpansion={forcedExpansion}
        category={category}
        tcgId={tcgId}
        tcgSlug={tcgSlug}
        initialResults={initialResults}
        initialPagination={initialPagination}
      />
    </Suspense>
  );
}

function SearchClientInner({
  forcedExpansion,
  category,
  tcgId,
  tcgSlug,
  initialResults = EMPTY_RESULTS,
  initialPagination = EMPTY_PAGINATION,
}: SinglesSearchProps) {
  const dispatch = useAppDispatch();
  const { activeTcgs, selectedTcg: currentTcg } = useAppSelector((state) => state.game);
  const searchParams = useSearchParams();
  const { push } = useRouter();
  const pathname = usePathname();
  const searchRoute = pathname ?? '/singles/search';
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const {
    results,
    loading,
    error,
    pagination,
    query,
    localParam,
    categoryParam,
    metadataParam,
    expansionParam,
    tcgIdParam,
  } = useSinglesSearch(
    searchParams,
    forcedExpansion,
    category,
    initialResults,
    initialPagination,
    tcgSlug
  );

  // Sync selected TCG with store if tcgId is present in URL or passed as prop
  useEffect(() => {
    const resolvedTcgId = tcgIdParam || tcgId;
    if (resolvedTcgId && activeTcgs.length > 0) {
      const foundTcg = activeTcgs.find((t) => t.id === resolvedTcgId);
      if (foundTcg && foundTcg.id !== currentTcg?.id) {
        dispatch(setSelectedTcg(foundTcg));
      }
    }
  }, [tcgIdParam, tcgId, activeTcgs, currentTcg, dispatch]);

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      if (forcedExpansion) {
        push(`/singles/set/${encodeURIComponent(forcedExpansion)}?page=${page.toString()}`);
      } else {
        push(`${searchRoute}?${params.toString()}`);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [searchParams, push, forcedExpansion, searchRoute]
  );

  const cardDataList = useMemo(() => {
    return results.map((result, index) => {
      // Prioritize local database UUID for stable identification, fallback to importationId
      let stableId: string;
      if (
        result.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.id)
      ) {
        stableId = result.id;
      } else {
        // importationId is shared by multiple variants (e.g. EN/JP, foil/non-foil).
        // Append language + foil to make the key unique per variant.
        const lang = result.language || '';
        const foilSuffix = result.foil ? '-foil' : '';
        stableId = result.importationId
          ? `${result.importationId}-${lang}${foilSuffix}`
          : `idx-${index}`;
      }

      const cardData: CardData = {
        id: stableId,
        title: result.cardName,
        cardName: result.cardName,
        price: normalizePrice(result.price ?? result.finalPrice),
        imageUrl: result.img || '',
        stock: result.stock,
        expansion: result.expansion,
        variant: result.variant,
        condition: result.condition,
        language: resolveLanguageName(result.language),
        immediateDelivery: result.isLocalInventory,
        isLocalInventory: result.isLocalInventory,
        importationId: result.importationId || null,
        foil: result.foil,
        isBundle:
          ['PRECON_DECK', 'CONSTRUCTED_DECK', 'BUNDLE', 'BOOSTER_BOX', 'SEALED'].includes(
            result.category || ''
          ) || result.metadata?.includes('Bundle'),
        metadata: result.metadata,
        tags: Array.isArray(result.tags)
          ? result.tags.flatMap((t: string | { name: string }) => {
              const val = typeof t === 'string' ? t : t?.name || '';
              return val ? [val] : [];
            })
          : [],
        basePriceJPY: result.basePriceJPY,
        finalPrice: result.finalPrice,
        basePriceMXN: result.basePriceMXN,
        importFeeMXN: result.importFeeMXN,
        originalPrice: result.originalPrice,
        price_mxn_importation: result.price_mxn_importation,
        price_mxn_local: result.price_mxn_local,
        expansionCode: result.expansionCode,
        isSerialized: result.isSerialized,
        isAlternateFrame: result.isAlternateFrame,
        isShowcase: result.isShowcase,
        isOnSale: !!result.originalPrice && result.originalPrice !== result.price,
        category: result.category,
        tcg: result.tcg,
        tcgId: result.tcgId,
      };
      const rawHref = stableId ? `/singles/${stableId}` : undefined;
      if (rawHref) {
        cardData.href = computeFinalHref({
          ...cardData,
          href: rawHref,
        });
      }
      return cardData;
    });
  }, [results]);

  const displayTotal = (pagination?.total ?? 0) > 0 ? pagination!.total : results.length;

  const resultsTitle = useMemo(() => {
    if (localParam && !query) {
      if (categoryParam) return getCategoryDisplay(categoryParam);
      if (metadataParam === 'cEDH Staple') return 'cEDH Staple';
      if (metadataParam) return 'Commander';
      return 'Singles';
    }
    if (expansionParam) return `Singles de ${expansionParam}`;
    if (query) return `Resultados para "${query}"`;
    return 'Resultados';
  }, [localParam, query, categoryParam, metadataParam, expansionParam]);

  return (
    <div className="min-h-screen bg-vault-bg text-white antialiased relative overflow-hidden font-display">
      {/* Background glows */}
      <div className="absolute top-0 right-0 size-[900px] bg-teal/5 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute top-[15%] left-0 size-[700px] bg-teal/3 rounded-full blur-[120px] -translate-x-1/3 pointer-events-none z-0" />

      {currentTcg && <SearchBreadcrumbs currentTcg={currentTcg} categoryParam={categoryParam} />}

      <SearchMobileResults
        loading={loading}
        error={error}
        query={query}
        results={results}
        resultsTitle={resultsTitle}
        pagination={pagination}
        displayTotal={displayTotal}
        cardDataList={cardDataList}
        handlePageChange={handlePageChange}
        searchRoute={searchRoute}
        onOpenModal={() => setIsSearchModalOpen(true)}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        searchRoute={searchRoute}
        extraParams={{ pagination: 'true' }}
      />

      <SearchDesktopResults
        loading={loading}
        error={error}
        results={results}
        resultsTitle={resultsTitle}
        pagination={pagination}
        displayTotal={displayTotal}
        cardDataList={cardDataList}
        handlePageChange={handlePageChange}
        searchRoute={searchRoute}
      />
    </div>
  );
}
