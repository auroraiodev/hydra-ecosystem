import React, { useRef } from 'react';
import { SinglesSearch } from '../SinglesSearch';
import { ImportationCard, ImportationSearchFilters } from '../../types';

interface SinglesSearchCardProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  suggestions: string[];
  selectedIndex: number;
  onSuggestionSelect: (suggestion: string) => void;
  importationResults: ImportationCard[];
  onImportationCardSelect: (card: ImportationCard) => void;
  importationFilters: ImportationSearchFilters;
  uiState: {
    isSearching: boolean;
    showDropdown: boolean;
    showImportationResults: boolean;
    isSearchingImportation: boolean;
    showCamera: boolean;
    setShowCamera: (val: boolean) => void;
  };
  isSubmitting?: boolean;
}

export function SinglesSearchCard({
  searchQuery,
  onSearchChange,
  onKeyDown,
  suggestions,
  selectedIndex,
  onSuggestionSelect,
  importationResults,
  onImportationCardSelect,
  importationFilters: _importationFilters,
  uiState,
  isSubmitting = false,
}: SinglesSearchCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isSearching, showDropdown, showImportationResults, isSearchingImportation, showCamera, setShowCamera } = uiState;

  return (
    <div className="relative z-20">
      <SinglesSearch
        input={{
          ref: containerRef,
          query: searchQuery,
          onChange: onSearchChange,
          onKeyDown: onKeyDown,
          isSubmitting,
        }}
        ui={{
          isSearching,
          isScanning: showCamera,
          onToggleScanning: setShowCamera,
        }}
        dropdown={{
          isOpen: showDropdown,
          setOpen: () => {}, // Handled by search state
          selectedIndex,
          suggestions,
          onSuggestionSelect,
          importation: {
            showResults: showImportationResults,
            isSearching: isSearchingImportation,
            results: importationResults,
            onSelect: onImportationCardSelect,
            query: searchQuery,
          },
        }}
      />
    </div>
  );
}

