import React, { memo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { cn } from '@/lib/utils';
import { type PaginationProps } from '../types/Shared.types';

export const Pagination = memo(function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  variant = 'default',
}: PaginationProps & { variant?: 'default' | 'vault' }) {
  const handlePageClick = useCallback((page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    if (onPageChange) {
      onPageChange(page);
    }
  }, [currentPage, totalPages, onPageChange]);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Show 1, 2, 3, 4, ..., last
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show 1, ..., last-3, last-2, last-1, last
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show 1, ..., current-1, current, current+1, ..., last
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const isVault = variant === 'vault';

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <FlowButton
        variant={isVault ? 'vault' : 'outline'}
        size="icon"
        className={cn('size-10', isVault && currentPage === 1 && 'opacity-30 border-white/5')}
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-5" />
      </FlowButton>

      {pageNumbers.map((page, index) => {
        if (page === '...') {
          const prevPage = index > 0 ? pageNumbers[index - 1] : 'start';
          const nextPage = index < pageNumbers.length - 1 ? pageNumbers[index + 1] : 'end';
          return (
            <span
              key={`ellipsis-${prevPage}-${nextPage}`}
              className={cn('px-2', isVault ? 'text-white/20' : 'text-zinc-400')}
            >
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <FlowButton
            key={pageNum}
            variant={isActive ? (isVault ? 'vault' : 'default') : isVault ? 'vault' : 'outline'}
            size="icon"
            className={cn(
              'size-10 font-bold transition-all',
              isVault &&
                !isActive &&
                'bg-transparent border-white/5 opacity-50 hover:opacity-100 hover:border-white/20',
              isVault && isActive && 'shadow-[0_0_15px_rgba(var(--glow-teal-rgb)/0.3)] border-teal/50'
            )}
            onClick={() => handlePageClick(pageNum)}
            aria-label={`Ir a página ${pageNum}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNum}
          </FlowButton>
        );
      })}

      <FlowButton
        variant={isVault ? 'vault' : 'outline'}
        size="icon"
        className={cn(
          'size-10',
          isVault && currentPage === totalPages && 'opacity-30 border-white/5'
        )}
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Página siguiente"
      >
        <ChevronRight className="size-5" />
      </FlowButton>
    </div>
  );
});
Pagination.displayName = 'Pagination';

