'use client';

import React from 'react';
import Image from 'next/image';
import { Search24Regular, Box24Regular, Camera24Regular } from '@fluentui/react-icons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { ImportationCard } from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SinglesSearchProps {
  input: {
    ref: React.RefObject<HTMLDivElement | null>;
    query: string;
    onChange: (val: string) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    isSubmitting?: boolean;
  };
  ui: {
    isSearching: boolean;
    isScanning: boolean;
    onToggleScanning: (val: boolean) => void;
  };
  dropdown: {
    isOpen: boolean;
    setOpen: (val: boolean) => void;
    selectedIndex: number;
    suggestions: string[];
    onSuggestionSelect: (s: string) => void;
    importation: {
      showResults: boolean;
      isSearching: boolean;
      results: ImportationCard[];
      onSelect: (c: ImportationCard) => void;
      query: string;
    };
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SinglesSearch({ input, ui, dropdown }: SinglesSearchProps) {
  const {
    ref: autocompleteRef,
    query: searchQuery,
    onChange: handleSearchChange,
    onKeyDown: handleKeyDown,
    isSubmitting,
  } = input;
  const { isSearching, isScanning: showCamera, onToggleScanning: setShowCamera } = ui;
  const {
    isOpen: showDropdown,
    setOpen: setShowDropdown,
    selectedIndex,
    suggestions,
    onSuggestionSelect: handleSuggestionSelect,
    importation,
  } = dropdown;
  const {
    showResults: showImportationResults,
    isSearching: isSearchingImportation,
    results: importationResults,
    onSelect: handleImportationCardSelect,
    query: selectedSuggestion,
  } = importation;

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
              if (searchQuery.length >= 2 || showImportationResults) setShowDropdown(true);
            }}
            placeholder="Nombre de carta — Enter para buscar en Importation"
            className="pr-10"
          />
          {isSearching ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner size="sm" />
            </div>
          ) : searchQuery.length >= 2 ? (
            <Search24Regular className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          ) : null}
        </div>
        <Button
          variant={showCamera ? 'secondary' : 'ghost'}
          size="icon"
          className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 size-10 border border-zinc-200 dark:border-zinc-700 shrink-0"
          onClick={() => setShowCamera(!showCamera)}
          type="button"
          title="Escáner OCR"
        >
          {showCamera ? (
            <span className="text-xs font-bold">✕</span>
          ) : (
            <Camera24Regular className="size-5 text-zinc-700 dark:text-zinc-300" />
          )}
        </Button>
      </div>

      {/* Dropdown results */}
      {showDropdown && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-auto',
            showImportationResults ? 'max-h-[600px]' : 'max-h-60'
          )}
        >
          {showImportationResults ? (
            <>
              <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-b border-border">
                {isSearchingImportation
                  ? `Buscando en Importation: ${selectedSuggestion}…`
                  : `${importationResults.length} resultado${importationResults.length !== 1 ? 's' : ''} para: ${selectedSuggestion}`}
              </div>
              {isSearchingImportation ? (
                <div className="px-3 py-4 text-center">
                  <Spinner size="sm" />
                  <p className="mt-2 text-sm text-muted-foreground">Buscando…</p>
                </div>
              ) : importationResults.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No se encontraron resultados para: {selectedSuggestion}
                  </p>
                </div>
              ) : (
                importationResults.map((card: ImportationCard) => (
                  <button
                    key={`${card.id || card.productId}-${card.language}-${card.set}`}
                    type="button"
                    className="w-full text-left p-4 text-base cursor-pointer border-b border-border last:border-b-0 transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => !isSubmitting && handleImportationCardSelect(card)}
                    disabled={isSubmitting}
                    style={{
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
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
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
                            {card.language && ` • ${card.language}`}
                          </div>
                        )}
                        <div className="space-y-1 mb-3">
                          {card.price_mxn_local !== undefined && card.price_mxn_local > 0 && (
                            <div className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                                Local
                              </span>
                              ${card.price_mxn_local.toFixed(2)} MXN
                            </div>
                          )}
                          {card.price_mxn_importation !== undefined &&
                            card.price_mxn_importation > 0 && (
                              <div className="text-sm font-medium text-blue-600 flex items-center gap-1.5">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                                  Import
                                </span>
                                ${card.price_mxn_importation.toFixed(2)} MXN
                              </div>
                            )}
                          {!card.price_mxn_local &&
                            !card.price_mxn_importation &&
                            (card.formattedPrice ?? card.price) && (
                              <div className="text-base font-semibold text-primary">
                                {card.formattedPrice ?? String(card.price ?? '')}
                              </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {card.foil && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 rounded uppercase">
                              Foil
                            </span>
                          )}
                          {card.surgeFoil && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded uppercase">
                              Surge Foil
                            </span>
                          )}
                          {card.isSerialized && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 rounded uppercase">
                              Serialized
                            </span>
                          )}
                          {card.isShowcase && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-200 rounded uppercase">
                              Showcase
                            </span>
                          )}
                          {card.isAlternateFrame && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200 rounded uppercase">
                              Alt Frame
                            </span>
                          )}
                          {card.borderless && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 rounded uppercase">
                              Borderless
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </>
          ) : (
            <>
              {isSearching && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Buscando…</div>
              )}
              {!isSearching && suggestions.length === 0 && searchQuery.length >= 2 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No se encontraron sugerencias. Presiona Enter para buscar en Importation.
                </div>
              )}
              {!isSearching &&
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
                          Presiona para buscar en Importation…
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
