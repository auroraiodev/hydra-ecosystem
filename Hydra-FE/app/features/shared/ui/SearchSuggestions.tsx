'use client';

import { Search } from 'lucide-react';
import { FlowButton } from './flow-button';

interface SearchSuggestionsProps {
  show: boolean;
  suggestions: string[];
  selectedIndex: number;
  isVault: boolean;
  onSelect: (suggestion: string) => void;
}

export function SearchSuggestions({
  show,
  suggestions,
  selectedIndex,
  isVault,
  onSelect,
}: SearchSuggestionsProps) {
  if (!show || suggestions.length === 0) return null;
  return (
    <div
      id="search-suggestions"
      role="listbox"
      aria-label="Sugerencias de búsqueda"
      className={`absolute top-full left-0 right-0 mt-2 ${
        isVault
          ? 'vault-glass-card bg-vault-surface/95 border-white/10'
          : 'glass-panel bg-white/95 border-border-subtle'
      } rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto overflow-x-hidden backdrop-blur-xl`}
      style={{ zIndex: 50 }}
    >
      <div className="p-1.5 gap-y-1">
        {suggestions.map((suggestion: string, index: number) => (
          <FlowButton
            key={suggestion}
            id={`suggestion-${index}`}
            type="button"
            variant="ghost"
            simple
            className={`w-full text-left px-4 py-3 ${
              isVault
                ? 'hover:bg-white/10 active:bg-white/15 text-white'
                : 'hover:bg-surface-low active:bg-surface-high text-text-body'
            } transition-all duration-200 text-sm rounded-lg flex items-center justify-start group ${
              index === selectedIndex
                ? isVault
                  ? 'bg-teal/20 text-teal font-semibold'
                  : 'bg-primary/10 text-primary font-semibold'
                : ''
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(suggestion);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
          >
            <div className="flex items-center gap-3 w-full">
              <Search
                className={`size-4 shrink-0 transition-colors ${
                  isVault
                    ? index === selectedIndex
                      ? 'text-teal'
                      : 'text-vault-text-muted group-hover:text-teal'
                    : index === selectedIndex
                      ? 'text-primary'
                      : 'text-text-muted group-hover:text-primary'
                }`}
              />
              <span className="relative z-10 truncate flex-1">{suggestion}</span>
            </div>
          </FlowButton>
        ))}
      </div>
    </div>
  );
}
