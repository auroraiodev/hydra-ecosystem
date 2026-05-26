"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Button } from '../Button';

export type SearchVariant = 'default' | 'compact' | 'large' | 'vault';

export interface SearchInputProps {
  /** Controlled value. If omitted the component manages its own state. */
  value?: string;
  onChange?: (value: string) => void;
  /** Called when the user submits the search (Enter or suggestion click). */
  onSearch: (query: string) => void;
  suggestions?: string[];
  isLoadingSuggestions?: boolean;
  placeholder?: string;
  className?: string;
  variant?: SearchVariant;
  autoFocus?: boolean;
  readOnly?: boolean;
  onClick?: () => void;
}

const EMPTY_SUGGESTIONS: string[] = [];

export function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  suggestions = EMPTY_SUGGESTIONS,
  isLoadingSuggestions = false,
  placeholder = 'Search...',
  className = '',
  variant = 'default',
  autoFocus = false,
  readOnly = false,
  onClick,
}: SearchInputProps) {
  const [internalQuery, setInternalQuery] = useState('');
  const query = controlledValue ?? internalQuery;
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCompact = variant === 'compact';
  const isLarge   = variant === 'large';
  const isVault   = variant === 'vault';

  useEffect(() => {
    const hasSuggestions = suggestions.length > 0 && query.length >= 2;
    setShowSuggestions(hasSuggestions);
  }, [suggestions, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
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

   // Auto-focus handled via input attribute

  const handleInputChange = (val: string) => {
    if (controlledValue === undefined) setInternalQuery(val);
    onChange?.(val);
    setSelectedIndex(-1);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (controlledValue === undefined) setInternalQuery('');
    onChange?.('');
    onSearch(suggestion);
  };

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    onSearch(q.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (showSuggestions && suggestions.length > 0 && selectedIndex >= 0) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (query.trim()) {
        handleSearch(query);
      }
      return;
    }
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((p) => (p < suggestions.length - 1 ? p + 1 : p));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((p) => (p > 0 ? p - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) handleSearch(query);
  };

  const clearSearch = () => {
    if (controlledValue === undefined) setInternalQuery('');
    onChange?.('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const containerClass = [
    'relative flex items-center w-full transition-all duration-200 ease-in-out',
    isCompact
      ? 'rounded-full h-10'
      : isVault
        ? 'rounded-2xl h-14 vault-glass-card border border-white/10 focus-within:border-teal/60 focus-within:shadow-[0_0_24px_rgba(20,184,166,0.2)]'
        : isLarge
          ? 'rounded-2xl h-14 bg-surface border border-border-subtle shadow-lg focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_rgba(20,138,129,0.12)]'
          : 'rounded-xl h-12 bg-white border border-border-subtle shadow-sm hover:border-primary/30 focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_rgba(20,138,129,0.1)]',
  ].join(' ');

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      style={{ zIndex: showSuggestions ? 50 : isLarge ? 10 : 20 }}
    >
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className={containerClass}>
          <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-4">
            {isLoadingSuggestions && query.length >= 2
              ? <Loader2 className={`animate-spin size-5 ${isVault ? 'text-teal/70' : 'text-primary/60'}`} />
              : <Search className={`${isCompact ? 'text-text-muted size-4' : isLarge || isVault ? `${isVault ? 'text-teal/70' : 'text-primary/50'} size-5` : 'text-text-muted size-[22px]'}`} />
            }
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls="search-suggestions"
            aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
            className={[
              'block w-full border-none focus:outline-none focus:ring-0 bg-transparent transition-colors',
              isCompact ? 'py-2 pl-10 pr-10 text-sm' : isLarge || isVault ? 'py-3 pl-12 pr-12 text-base' : 'p-3.5 pl-12 pr-12',
              isVault ? 'text-white placeholder:text-vault-text-muted' : 'text-text-body placeholder:text-text-muted',
            ].join(' ')}
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
              aria-label="Clear search"
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

      {showSuggestions && suggestions.length > 0 && (
        <div
          id="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className={`absolute top-full left-0 right-0 mt-2 ${
            isVault
              ? 'vault-glass-card bg-vault-surface/95 border-white/10'
              : 'glass-panel bg-white/95 border-border-subtle'
          } rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto overflow-x-hidden backdrop-blur-xl`}
        >
          <div className="p-1.5 space-y-1">
            {suggestions.map((suggestion, index) => (
              <Button
                key={suggestion}
                id={`suggestion-${index}`}
                type="button"
                variant="ghost"
                simple
                className={[
                  'w-full text-left px-4 py-3 transition-all duration-200 text-sm rounded-lg flex items-center justify-start group',
                  isVault
                    ? 'hover:bg-white/10 active:bg-white/15 text-white'
                    : 'hover:bg-surface-low active:bg-surface-high text-text-body',
                  index === selectedIndex
                    ? isVault ? 'bg-teal/20 text-teal font-semibold' : 'bg-primary/10 text-primary font-semibold'
                    : '',
                ].join(' ')}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSelectSuggestion(suggestion); }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center gap-3 w-full">
                  <Search className={`size-4 shrink-0 transition-colors ${
                    isVault
                      ? index === selectedIndex ? 'text-teal' : 'text-vault-text-muted group-hover:text-teal'
                      : index === selectedIndex ? 'text-primary' : 'text-text-muted group-hover:text-primary'
                  }`} />
                  <span className="relative z-10 truncate flex-1">{suggestion}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
