'use client';

import { SearchInput, CardSkeleton } from '@/features/shared/ui';
import { MobilePageContainer } from '@/features/shared/components/PageContainers';
import { FadeUp, StaggerContainer, StaggerItem } from '@/features/shared/components/Animations';
import { EnhancedCard } from '@/features/products/components';
import { Pagination } from '@/features/shared/components/Pagination';
import type { CardData } from '@/features/products/types';
import type { HybridSearchResult, SearchPagination } from '../types';

interface SearchMobileResultsProps {
  loading: boolean;
  error: string | null;
  query: string | null;
  results: HybridSearchResult[];
  resultsTitle: string;
  pagination: SearchPagination | null;
  displayTotal: number;
  cardDataList: CardData[];
  handlePageChange: (page: number) => void;
  searchRoute: string;
  onOpenModal: () => void;
}

export function SearchMobileResults({
  loading,
  error,
  query,
  results,
  resultsTitle,
  pagination,
  displayTotal,
  cardDataList,
  handlePageChange,
  searchRoute,
  onOpenModal,
}: SearchMobileResultsProps) {
  return (
    <MobilePageContainer className="bg-transparent !p-0 relative z-10">
      <main className="flex flex-col gap-6 pt-4 pb-20">
        <div className="px-4 pt-2">
          <SearchInput
            placeholder="Buscar singles"
            className="w-full"
            variant="vault"
            searchType="singles"
            searchRoute={searchRoute}
            readOnly={true}
            onClick={onOpenModal}
          />
        </div>

        {loading && results.length === 0 && (
          <div className="px-4">
            <div className="grid grid-cols-2 gap-4">
              <CardSkeleton count={12} variant="vault" />
            </div>
          </div>
        )}
        {error && (
          <div className="px-4 text-center py-8">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}
        {!loading && !error && query && results.length === 0 && (
          <div className="px-4 text-center py-8">
            <p className="text-text-muted">No se encontraron resultados para &quot;{query}&quot;</p>
          </div>
        )}

        {!error && results.length > 0 && (
          <div className="px-4">
            <FadeUp>
              <h2 className="text-xl font-semibold text-white mb-2 tracking-tight uppercase">
                {resultsTitle}
              </h2>
              {pagination && (
                <p className="text-sm text-vault-text-muted mb-4">
                  {displayTotal} resultado{displayTotal !== 1 ? 's' : ''} encontrado
                  {displayTotal !== 1 ? 's' : ''}
                </p>
              )}
            </FadeUp>
            <StaggerContainer className="grid grid-cols-2 gap-4 pt-2">
              {cardDataList.map((cardData, idx) => (
                <StaggerItem key={cardData.id} delay={idx * 0.03}>
                  <EnhancedCard card={cardData} variant="singles" priority={idx < 4} />
                </StaggerItem>
              ))}
            </StaggerContainer>
            {pagination && pagination.totalPages > 1 && (
              <FadeUp className="mt-6" delay={0.2}>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </FadeUp>
            )}
          </div>
        )}
      </main>
    </MobilePageContainer>
  );
}
