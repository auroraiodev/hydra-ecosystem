'use client';

import { SearchModal } from '@/features/search-filters';
import { SearchInput } from '@/features/shared/ui';
import { useState } from 'react';

export default function BrowsePage() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  return (
    <div className="bg-background lg:bg-transparent font-display text-text-body min-h-screen pb-24 lg:pb-0 antialiased">
      <main className="flex flex-col gap-6 pt-6 px-4 lg:max-w-7xl lg:mx-auto lg:px-4 lg:sm:px-6 lg:py-8">
        <div className="w-full">
          <h1 className="text-2xl lg:text-3xl font-semibold text-text-body lg:text-text-body mb-4 lg:mb-6">
            Buscar
          </h1>
          {/* Mobile: opens modal */}
          <div className="lg:hidden">
            <SearchInput
              placeholder="Buscar cartas, sets o jugadores..."
              className="w-full"
              variant="default"
              readOnly={true}
              onClick={() => setIsSearchModalOpen(true)}
            />
          </div>
          {/* Desktop: inline with suggestions */}
          <div className="hidden lg:block">
            <SearchInput
              placeholder="Buscar cartas, sets o jugadores..."
              className="w-full max-w-2xl"
              variant="default"
              searchType="general"
              searchRoute="/singles/search"
            />
          </div>
        </div>
      </main>

      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
    </div>
  );
}
