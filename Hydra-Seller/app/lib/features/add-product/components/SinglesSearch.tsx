'use client';

import React from 'react';
import Image from 'next/image';
import { Search24Regular, Box24Regular, Camera24Regular } from '@fluentui/react-icons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { ImportationCard, ImportationSearchFilters } from '../types';

// --- Filter constants ---------------------------------------------------------

const LANG_QUICK = [
  { code: '', label: 'Todos' },
  { code: '2', label: 'EN' },
  { code: '1', label: 'JP' },
  { code: '11', label: 'ES' },
];

const LANG_MORE = [
  { code: '3', label: 'Franc�s' },
  { code: '6', label: 'Alem�n' },
  { code: '4', label: 'Chino' },
  { code: '8', label: 'Coreano' },
  { code: '7', label: 'Italiano' },
  { code: '9', label: 'Portugu�s' },
];

const CONDITIONS = [
  { code: '', label: 'Condici�n' },
  { code: '1', label: 'NM' },
  { code: '2', label: 'SP' },
  { code: '3', label: 'MP' },
  { code: '4', label: 'HP' },
  { code: '5', label: 'DM' },
];

const SORT_OPTIONS = [
  { code: '', label: 'Relevancia' },
  { code: 'price asc', label: 'Precio ?' },
  { code: 'price desc', label: 'Precio ?' },
  { code: 'stock desc', label: 'Stock ?' },
];

// --- Inline select ------------------------------------------------------------

function FilterSelect({
  value,
  onChange,
  options,
  active,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { code: string; label: string }[];
  active?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-8 rounded-full border px-3 text-xs bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring transition-colors',
        active
          ? 'border-primary text-primary font-semibold bg-primary/5'
          : 'border-border text-muted-foreground hover:border-foreground/40'
      )}
    >
      {options.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// --- Toggle chip --------------------------------------------------------------

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 rounded-full border px-3 text-xs cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-ring',
        active
          ? 'border-primary bg-primary/10 text-primary font-semibold'
          : 'border-border text-muted-foreground hover:border-foreground/40 bg-background'
      )}
    >
      {children}
    </button>
  );
}

// --- Props --------------------------------------------------------------------

type SinglesSearchMode = 'idle' | 'searching' | 'searching-importation';

interface SinglesSearchProps {
  autocompleteRef: React.RefObject<HTMLDivElement | null>;
  searchQuery: string;
  handleSearchChange: (val: string) => void;
  isSubmitting: boolean;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  suggestions: string[];
  show: { importationResults: boolean; camera: boolean; dropdown: boolean };
  setShowDropdown: (val: boolean) => void;
  searchMode: SinglesSearchMode;
  setShowCamera: (val: boolean) => void;
  selectedSuggestion: string;
  importationResults: ImportationCard[];
  handleImportationCardSelect: (card: ImportationCard) => void;
  handleSuggestionSelect: (suggestion: string) => void;
  selectedIndex: number;
  importationFilters?: ImportationSearchFilters;
  onFiltersChange?: (filters: ImportationSearchFilters) => void;
}

// --- Component ----------------------------------------------------------------

const EMPTY_IMPORTATION_FILTERS: ImportationSearchFilters = {};

export function SinglesSearch({
  autocompleteRef,
  searchQuery,
  handleSearchChange,
  isSubmitting,
  handleKeyDown,
  suggestions,
  show,
  setShowDropdown,
  searchMode,
  setShowCamera,
  selectedSuggestion,
  importationResults,
  handleImportationCardSelect,
  handleSuggestionSelect,
  selectedIndex,
  importationFilters = EMPTY_IMPORTATION_FILTERS,
  onFiltersChange,
}: SinglesSearchProps) {
  const update = (patch: Partial<ImportationSearchFilters>) =>
    onFiltersChange?.({ ...importationFilters, ...patch });

  // Is the selected language one of the "more" languages?
  const langIsMore = LANG_MORE.some((l) => l.code === importationFilters.language);

  return (
    <div className="relative" ref={autocompleteRef}>
      <Label htmlFor="search" className="text-base font-medium">
        Buscar Carta
      </Label>

      {/* Search row */}
      <div className="flex gap-2 mt-2">
        <div className="relative flex-1">
          <Input
            id="search"
            value={searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={isSubmitting}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0 || show.importationResults) setShowDropdown(true);
            }}
            placeholder="Nombre de carta � Enter para buscar en Importation"
            className="pr-10"
          />
          {searchMode === 'searching' ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner size="small" />
            </div>
          ) : searchQuery.length >= 2 ? (
            <Search24Regular className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          ) : null}
        </div>
        <Button
          variant={show.camera ? 'secondary' : 'ghost'}
          size="icon"
          className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 size-10 border border-zinc-200 dark:border-zinc-700 shrink-0"
          onClick={() => setShowCamera(!show.camera)}
          type="button"
          title="Esc�ner OCR"
        >
          {show.camera ? (
            <span className="text-xs font-bold">?</span>
          ) : (
            <Camera24Regular className="size-5 text-zinc-700 dark:text-zinc-300" />
          )}
        </Button>
      </div>

      {/* Filter bar � always visible */}
      <div className="mt-2 space-y-1.5">
        {/* Row 1: Language */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-14 shrink-0">
            Idioma
          </span>
          {LANG_QUICK.map((l) => (
            <FilterChip
              key={l.code}
              active={
                importationFilters.language === l.code ||
                (!importationFilters.language && l.code === '')
              }
              onClick={() => update({ language: l.code || undefined })}
            >
              {l.label}
            </FilterChip>
          ))}
          {/* More languages */}
          <select
            value={langIsMore ? (importationFilters.language ?? '') : ''}
            onChange={(e) => update({ language: e.target.value || undefined })}
            className={cn(
              'h-8 rounded-full border px-3 text-xs bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring transition-colors appearance-none pr-6',
              langIsMore
                ? 'border-primary text-primary font-semibold bg-primary/5'
                : 'border-border text-muted-foreground hover:border-foreground/40'
            )}
          >
            <option value="">M�s�</option>
            {LANG_MORE.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Row 2: Condition, Sort, toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-14 shrink-0">
            Filtros
          </span>

          {/* Condition */}
          <FilterSelect
            value={importationFilters.condition ?? ''}
            onChange={(v) => update({ condition: v || undefined })}
            options={CONDITIONS}
            active={!!importationFilters.condition}
          />

          {/* Sort */}
          <FilterSelect
            value={importationFilters.sort ?? ''}
            onChange={(v) => update({ sort: v || undefined })}
            options={SORT_OPTIONS}
            active={!!importationFilters.sort}
          />

          <div className="w-px h-4 bg-border mx-0.5 shrink-0" />

          {/* Foil */}
          <FilterChip
            active={!!importationFilters.foil}
            onClick={() => update({ foil: !importationFilters.foil || undefined })}
          >
            ? Foil
          </FilterChip>

          {/* Include out of stock */}
          <FilterChip
            active={!!importationFilters.includeOutOfStock}
            onClick={() =>
              update({ includeOutOfStock: !importationFilters.includeOutOfStock || undefined })
            }
          >
            Sin stock
          </FilterChip>

          {/* Clear all */}
          {(importationFilters.language ||
            importationFilters.condition ||
            importationFilters.foil ||
            importationFilters.sort ||
            importationFilters.includeOutOfStock) && (
            <>
              <div className="w-px h-4 bg-border mx-0.5 shrink-0" />
              <button
                type="button"
                onClick={() => onFiltersChange?.({})}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                ? Limpiar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dropdown results */}
      {show.dropdown && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-auto',
            show.importationResults ? 'max-h-[600px]' : 'max-h-60'
          )}
        >
          {show.importationResults ? (
            <>
              <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-b border-border">
                {searchMode === 'searching-importation'
                  ? `Buscando en Importation: ${selectedSuggestion}�`
                  : `${importationResults.length} resultado${importationResults.length !== 1 ? 's' : ''} para: ${selectedSuggestion}`}
              </div>
              {searchMode === 'searching-importation' ? (
                <div className="px-3 py-4 text-center">
                  <Spinner size="small" />
                  <p className="mt-2 text-sm text-muted-foreground">Buscando�</p>
                </div>
              ) : importationResults.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No se encontraron resultados para: {selectedSuggestion}
                  </p>
                </div>
              ) : (
                importationResults.map((card: ImportationCard) => (
                  <div
                    key={`${card.importationId || card.id || card.productId}-${card.language}-${card.set}`}
                    className="p-4 text-base cursor-pointer border-b border-border last:border-b-0 transition-colors hover:bg-accent hover:text-accent-foreground"
                    role="button"
                    tabIndex={0}
                    onClick={() => !isSubmitting && handleImportationCardSelect(card)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        if (!isSubmitting) handleImportationCardSelect(card);
                      }
                    }}
                    style={{
                      pointerEvents: isSubmitting ? 'none' : 'auto',
                      opacity: isSubmitting ? 0.5 : 1,
                    }}
                  >
                    <div className="flex items-start gap-x-4">
                      {(card.img ?? card.imageUrl) ? (
                        <Image
                          src={card.img ?? card.imageUrl ?? '/placeholder-product.png'}
                          alt={card.name ?? card.title ?? 'Card'}
                          width={192}
                          height={256}
                          className="w-48 h-64 object-contain rounded shadow-md shrink-0"
                          unoptimized
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.png';
                          }}
                        />
                      ) : (
                        <div className="w-48 h-64 bg-muted rounded flex items-center justify-center shrink-0">
                          <Box24Regular className="size-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg text-foreground truncate mb-2">
                          {card.name ?? card.title ?? ''}
                        </div>
                        {String(card.set ?? card.expansion ?? '').trim() !== '' && (
                          <div className="text-sm text-muted-foreground truncate mb-3">
                            <span className="font-medium">
                              {String(card.set ?? card.expansion ?? '')}
                            </span>
                            {card.language && ` � ${card.language}`}
                          </div>
                        )}
                        {(card.formattedPrice ?? card.price) && (
                          <div className="text-base font-semibold mb-3 text-primary">
                            {card.formattedPrice ?? String(card.price ?? '')}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {card.foil && (
                            <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-md">
                              Foil
                            </span>
                          )}
                          {card.borderless && (
                            <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded-md">
                              Borderless
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              {searchMode === 'searching' && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Buscando�</div>
              )}
              {searchMode !== 'searching' &&
                suggestions.length === 0 &&
                searchQuery.length >= 2 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No se encontraron sugerencias. Presiona Enter para buscar en Importation.
                  </div>
                )}
              {searchMode === 'idle' &&
                suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => !isSubmitting && handleSuggestionSelect(suggestion)}
                    disabled={isSubmitting}
                    className={cn(
                      'w-full text-left px-3 py-3 text-sm cursor-pointer border-b border-border last:border-b-0 transition-colors',
                      selectedIndex === index
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground',
                      isSubmitting && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-x-3">
                      <Search24Regular className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{suggestion}</div>
                        <div className="text-xs text-muted-foreground">
                          Presiona para buscar en Importation�
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
