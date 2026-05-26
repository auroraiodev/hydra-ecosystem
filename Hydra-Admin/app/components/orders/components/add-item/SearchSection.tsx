'use client';

import React from 'react';
import { ArrowSync24Regular, Box24Regular, Add24Regular } from '@fluentui/react-icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SafeImg } from '@/components/ui/safe-img';
import { resolveLanguageName } from '@/lib/format';
import type { MinimalProduct } from './types';

interface SearchSectionProps {
  query: string;
  isLoading: boolean;
  suggestions: string[];
  results: MinimalProduct[];
  selectedCardName: string | null;
  onQueryChange: (query: string) => void;
  onSelectCard: (cardName: string) => void;
  onSelectProduct: (product: MinimalProduct) => void;
}

export function SearchSection({
  query,
  isLoading,
  suggestions,
  results,
  selectedCardName,
  onQueryChange,
  onSelectCard,
  onSelectProduct,
}: SearchSectionProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Type card name..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              onSelectCard(query.trim());
            }
          }}
          className="pr-10"
        />
        {isLoading && (
          <ArrowSync24Regular className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {suggestions.length > 0 && !selectedCardName && (
        <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-lg z-10 w-full mt-1">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="w-full text-left p-2 hover:bg-muted cursor-pointer text-sm transition-colors"
              onClick={() => onSelectCard(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {isLoading && results.length === 0 ? (
        <div className="flex justify-center p-8 text-muted-foreground text-sm">
          <ArrowSync24Regular className="size-5 animate-spin mr-2" />
          Searching…
        </div>
      ) : results.length > 0 ? (
        <div className="border rounded-md max-h-[400px] overflow-y-auto divide-y">
          {results.map((product) => (
            <div
              key={`${product.id || product.importationId || 'item'}`}
              role="button"
              tabIndex={0}
              className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors"
              onClick={() => onSelectProduct(product)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectProduct(product)}
            >
              <div className="h-24 w-18 relative flex-shrink-0 bg-secondary rounded overflow-hidden">
                <SafeImg
                  src={product.img || product.imageUrl}
                  alt={product.cardName || product.name || 'Product'}
                  className="object-cover size-full"
                  fallback={
                    <div className="size-full flex items-center justify-center">
                      <Box24Regular className="size-8 text-muted-foreground opacity-20" />
                    </div>
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate text-sm">
                    {product.cardName || product.name}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    {(product.foil || product.isFoil) && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-yellow-400 text-yellow-950 border-none font-bold">
                        FOIL
                      </Badge>
                    )}
                    {(product.language || product.lang) && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-zinc-100 text-zinc-700 border-zinc-200 uppercase font-bold"
                      >
                        {resolveLanguageName(product.language || product.lang)}
                      </Badge>
                    )}
                    {product.isImportationImport ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200"
                      >
                        Import
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
                      >
                        Local
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                  {product.expansion && <span>{product.expansion}</span>}
                  {product.cardNumber && <span>#{product.cardNumber}</span>}
                  {product.variant && product.variant !== product.expansion && (
                    <>
                      <span className="mx-0.5">•</span>
                      <span>{product.variant}</span>
                    </>
                  )}
                  <span className="mx-0.5">•</span>
                  <span>Stock: {product.stock}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">
                  ${Number(product.finalPrice ?? product.price).toFixed(2)}
                </div>
                <Button size="sm" variant="ghost" className="h-7 mt-1">
                  <Add24Regular className="size-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : selectedCardName ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No stock found for &quot;{selectedCardName}&quot;
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {query.length > 0
            ? 'Select a card to check stock'
            : 'Type at least 3 characters to search'}
        </div>
      )}
    </div>
  );
}
