'use client';

import { SearchInput, CardSkeleton } from '@/features/shared/ui';
import { DesktopPageContainer } from '@/features/shared/components/PageContainers';
import { FadeUp, StaggerContainer, StaggerItem } from '@/features/shared/components/Animations';
import { EnhancedCard } from '@/features/products/components';
import { Pagination } from '@/features/shared/components/Pagination';
import type { CardData } from '@/features/products/types';
import type { HybridSearchResult, SearchPagination } from '../types';

interface SearchDesktopResultsProps {
  loading: boolean;
  error: string | null;
  results: HybridSearchResult[];
  resultsTitle: string;
  pagination: SearchPagination | null;
  displayTotal: number;
  cardDataList: CardData[];
  handlePageChange: (page: number) => void;
  searchRoute: string;
}

export function SearchDesktopResults({
  loading,
  error,
  results,
  resultsTitle,
  pagination,
  displayTotal,
  cardDataList,
  handlePageChange,
  searchRoute,
}: SearchDesktopResultsProps) {
  return (
    <DesktopPageContainer className="bg-transparent relative z-10">
      <div className="pt-6 lg:pt-8 pb-24">
        <FadeUp className="mb-10 relative z-[9999]">
          <SearchInput
            placeholder="Buscar singles"
            className="w-full max-w-4xl mx-auto"
            variant="vault"
            searchType="singles"
            searchRoute={searchRoute}
          />
        </FadeUp>

        {loading && results.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <CardSkeleton count={12} variant="vault" />
          </div>
        )}

        {!error && results.length > 0 && (
          <div>
            <FadeUp>
              <h2 className="text-3xl font-semibold text-white mb-2 tracking-tight uppercase">
                {resultsTitle}
              </h2>
              {pagination && (
                <p className="text-sm text-vault-text-muted mb-8">
                  {displayTotal} resultado{displayTotal !== 1 ? 's' : ''} encontrado
                  {displayTotal !== 1 ? 's' : ''}
                </p>
              )}
            </FadeUp>
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {cardDataList.map((cardData, idx) => (
                <StaggerItem key={cardData.id} delay={idx * 0.02}>
                  <EnhancedCard card={cardData} variant="singles" />
                </StaggerItem>
              ))}
            </StaggerContainer>
            {pagination && pagination.totalPages > 1 && (
              <FadeUp className="mt-12" delay={0.2}>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </FadeUp>
            )}
          </div>
        )}
      </div>
    </DesktopPageContainer>
  );
}
