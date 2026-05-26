"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Button } from '../Button';

export interface VaultSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const EMPTY_SUGGESTIONS: string[] = [];

export function VaultSearch({
  value,
  onChange,
  onSearch,
  suggestions = EMPTY_SUGGESTIONS,
  onSuggestionClick,
  isLoading = false,
  placeholder = 'Search...',
  className = '',
  autoFocus = false,
}: VaultSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (showSuggestions && suggestions.length > 0 && selectedIndex >= 0) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        onSearch(value);
        setShowSuggestions(false);
      }
      return;
    }
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    } else {
      onChange(suggestion);
      onSearch(suggestion);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`} style={{ zIndex: 40 }}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center w-full transition-all duration-500 ease-in-out rounded-2xl h-14 border vault-glass-card border-white/10 bg-transparent focus-within:border-teal/50 focus-within:shadow-[0_0_20px_rgba(210,187,255,0.15)] focus-within:scale-[1.01] shadow-lg">
          <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-4">
            {isLoading
              ? <Loader2 className="animate-spin text-teal/70 size-5" />
              : <Search className="text-teal/70 size-5" />
            }
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => { onChange(e.target.value); setShowSuggestions(true); }}
            onFocus={() => value.length >= 2 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls="vault-search-suggestions"
            className="block w-full py-3 pl-12 pr-12 text-base text-white placeholder:text-vault-text-muted bg-transparent border-none focus:outline-none focus:ring-0 transition-colors"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {value && (
            <Button
              type="button"
              onClick={() => { onChange(''); setShowSuggestions(false); inputRef.current?.focus(); }}
              variant="ghost"
              size="icon"
              simple
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-vault-text-muted hover:text-white"
              aria-label="Clear search"
            >
              <X className="size-5" />
            </Button>
          )}
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div
          id="vault-search-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 vault-glass-card border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <Button
              key={suggestion}
              type="button"
              variant="ghost"
              simple
              className={[
                'w-full text-left px-4 py-2.5 hover:bg-white/5 active:bg-white/10 text-white transition-colors text-sm rounded-none flex items-center justify-start',
                index === selectedIndex ? 'bg-teal/20 text-teal font-medium' : '',
              ].join(' ')}
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <span className="relative z-10">{suggestion}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
