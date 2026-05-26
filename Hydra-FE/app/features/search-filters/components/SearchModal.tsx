'use client';

import { Modal, SearchInput, FlowButton } from '@/features/shared';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { useAutocomplete } from '../hooks/useAutocomplete';
import { Search, ArrowRight } from 'lucide-react';
import { useSearchLoading } from '@/features/search-filters/contexts/SearchLoadingContext';

import { type SearchModalProps } from '../types';

const EMPTY_EXTRA_PARAMS: Record<string, string> = {};

export function SearchModal({
  isOpen,
  onClose,
  searchRoute = '/singles/search',
  extraParams = EMPTY_EXTRA_PARAMS,
}: SearchModalProps) {
  const { push } = useRouter();
  const { startLoading } = useSearchLoading();
  const [query, setQuery] = useState('');

  const { suggestions, loading } = useAutocomplete(query, {
    searchType: searchRoute.includes('singles') ? 'singles' : 'general',
  });

  const handleSearch = (searchQuery: string) => {
    startLoading();
    onClose();

    const params = new URLSearchParams();
    params.set('query', searchQuery);
    Object.entries(extraParams).forEach(([key, value]) => {
      params.set(key, value);
    });

    push(`${searchRoute}?${params.toString()}`);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const showSuggestions = query.length >= 2 && suggestions.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      fullScreen
      className="md:!w-full md:!max-w-lg md:!mx-4 md:!mt-20 md:!h-auto md:!min-h-0 md:!rounded-2xl"
    >
      <div className="gap-y-4 pt-2 h-full flex flex-col">
        <h2 className="text-xl font-semibold text-text-body mb-4 md:block hidden">Buscar</h2>
        <div className="shrink-0">
          <SearchInput
            placeholder="Buscar singles, micas, bundles, carpetas ..."
            className="w-full"
            variant="large"
            searchRoute={searchRoute}
            onSearch={handleSearch}
            onChange={(val: string) => setQuery(val)}
            disableInternalSuggestions
          />
        </div>

        {/* Search Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {showSuggestions ? (
            <div className="py-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                  Sugerencias
                </span>
                {loading && (
                  <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <div className="gap-y-1">
                {suggestions.slice(0, 5).map((suggestion: string) => (
                  <FlowButton
                    key={suggestion}
                    variant="ghost"
                    simple
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-low group transition-all text-left border border-transparent hover:border-surface-high h-auto"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-surface-low flex items-center justify-center group-hover:bg-surface transition-colors">
                        <Search className="size-4 text-text-muted group-hover:text-primary" />
                      </div>
                      <span className="font-semibold text-text-body group-hover:text-primary transition-colors">
                        {suggestion}
                      </span>
                    </div>
                    <ArrowRight className="size-4 text-text-muted opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </FlowButton>
                ))}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50 pb-20">
              <div className="relative size-32 mb-4 grayscale">
                <Image src="/cat.png" alt="" width={128} height={128} className="object-contain" />
              </div>
              <h3 className="text-xl font-semibold text-text-muted/50 mb-2">Hydra Collectables</h3>
              <p className="text-lg font-medium text-text-muted/40">
                Encuentra tus cartas favoritasâ€¦
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
