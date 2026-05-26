'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAutocomplete } from '@/features/search-filters';
import { useSearchLoading } from '@/features/search-filters';
import { useAppSelector } from '@/lib/store/hooks';
import { SearchSuggestions } from './SearchSuggestions';

type SearchType = 'singles' | 'general';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  variant?: 'default' | 'compact' | 'large' | 'vault';
  autoFocus?: boolean;
  searchType?: SearchType;
  searchRoute?: string;
  readOnly?: boolean;
  onClick?: () => void;
  onChange?: (value: string) => void;
  disableInternalSuggestions?: boolean;
  externalSuggestions?: string[];
  isLoadingSuggestions?: boolean;
}

export function SearchInput({
  placeholder,
  className = '',
  onSearch,
  variant = 'default',
  autoFocus = false,
  searchType = 'singles',
  searchRoute,
  readOnly = false,
  onClick,
  onChange,
  disableInternalSuggestions = false,
  externalSuggestions,
  isLoadingSuggestions = false,
}: SearchInputProps) {
  const { push } = useRouter();
  const { startLoading } = useSearchLoading();
  const { selectedTcg } = useAppSelector((state) => state.game);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tcgName = selectedTcg?.display_name || selectedTcg?.name || 'Magic';
  const defaultPlaceholder = `Buscar cartas de ${tcgName}, accesorios, bundles …`;
  const activePlaceholder = placeholder || defaultPlaceholder;

  const { suggestions: internalSuggestions, loading: internalLoading } = useAutocomplete(
    disableInternalSuggestions ? '' : query,
    { searchType }
  );
  const suggestions = externalSuggestions || internalSuggestions;
  const isSuggestionsLoading = isLoadingSuggestions || internalLoading;

  // Show suggestions when we have them (suppressed when parent handles its own)
  const shouldShowSuggestions =
    !disableInternalSuggestions && suggestions.length > 0 && query.length >= 2;

  useEffect(() => {
    void Promise.resolve().then(() => setShowSuggestions(shouldShowSuggestions));
  }, [shouldShowSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    if (onChange) {
      onChange(value);
    }
  };

  const handleInputFocus = () => {
    if (!disableInternalSuggestions && query.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputBlur = () => {
    // Delay to allow suggestion clicks
    blurTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (showSuggestions && suggestions.length > 0 && selectedIndex >= 0) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (query.trim()) {
        handleSearch(query.trim());
      }
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    handleSearch(suggestion);
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    startLoading();

    if (onSearch) {
      onSearch(searchQuery);
    } else {
      const route = searchRoute || '/singles/search';
      const params = new URLSearchParams();
      params.set('query', searchQuery);
      if (selectedTcg?.id) {
        params.set('tcgId', selectedTcg.id);
      }
      push(`${route}?${params.toString()}`);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim());
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const isCompact = variant === 'compact';
  const isLarge = variant === 'large';
  const isVault = variant === 'vault';

  const inputClass = `${
    isCompact
      ? 'py-2 pl-10 pr-10 text-sm'
      : isLarge || isVault
        ? 'py-3 pl-12 pr-12 text-base'
        : 'p-3.5 pl-12 pr-12'
  } ${
    isVault
      ? 'text-white placeholder:text-vault-text-muted'
      : 'text-text-body placeholder:text-text-muted'
  } w-full bg-transparent border-none focus:outline-none focus:ring-0 transition-colors`;

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      style={{ zIndex: showSuggestions ? 50 : isLarge ? 10 : 100 }}
    >
      <form onSubmit={handleSubmit} className="relative w-full">
        <div
          className={`relative flex items-center w-full transition-all duration-200 ease-in-out ${
            isCompact
              ? 'rounded-full h-10'
              : isVault
                ? 'rounded-2xl h-14 vault-glass-card focus-within:border-teal/60 focus-within:shadow-[0_0_24px_rgba(var(--glow-teal-rgb)/0.2)]'
                : isLarge
                  ? 'rounded-2xl h-14 bg-surface border border-border-subtle shadow-lg focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_rgba(var(--glow-primary-rgb)/0.12)]'
                  : 'rounded-xl h-12 bg-white border border-border-subtle shadow-sm hover:border-primary/30 focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_rgba(var(--glow-primary-rgb)/0.1)]'
          }`}
        >
          <div
            className={`absolute inset-y-0 left-0 flex items-center pointer-events-none ${
              isLarge ? 'pl-4' : 'pl-4'
            }`}
          >
            {isSuggestionsLoading && query.length >= 2 ? (
              <Loader2
                className={`animate-spin size-5 ${isVault ? 'text-teal/70' : 'text-primary/60'}`}
              />
            ) : (
              <Search
                className={`${
                  isCompact
                    ? 'text-text-muted size-4'
                    : isLarge || isVault
                      ? `${isVault ? 'text-teal/70' : 'text-primary/50'} size-5`
                      : 'text-text-muted size-[22px]'
                }`}
              />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={activePlaceholder}
            aria-label={activePlaceholder || 'Buscar'}
            aria-autocomplete="list"
            className={inputClass}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            readOnly={readOnly}
            onClick={onClick}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Limpiar búsqueda"
              className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full p-1 transition-colors ${
                isVault
                  ? 'text-vault-text-muted hover:text-white hover:bg-white/10'
                  : 'text-text-muted hover:text-text-body hover:bg-surface-low'
              }`}
            >
              <X className={isCompact ? 'size-4' : 'size-5'} />
            </button>
          )}
        </div>
      </form>

      <SearchSuggestions
        show={showSuggestions}
        suggestions={suggestions}
        selectedIndex={selectedIndex}
        isVault={isVault}
        onSelect={handleSelectSuggestion}
      />
    </div>
  );
}
