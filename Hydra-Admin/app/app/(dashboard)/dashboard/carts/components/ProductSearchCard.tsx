import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search24Regular, Cart24Regular, Add24Regular, SpinnerIos20Regular } from '@fluentui/react-icons';
import { SafeImg } from '@/components/ui/safe-img';
import { resolveLanguageName } from '@/lib/format';

interface SearchProduct {
  id?: string;
  importationId?: string;
  productId?: string;
  name?: string;
  cardName?: string;
  title?: string;
  img?: string;
  imageUrl?: string;
  foil?: boolean;
  isFoil?: boolean;
  language?: string;
  lang?: string;
  expansion?: string;
  cardNumber?: string;
  variant?: string;
  price?: number | string;
  owner?: { first_name?: string; last_name?: string; username?: string };
  isImportationImport?: boolean;
  isLocalInventory?: boolean;
}

interface ProductSearchCardProps {
  productSearch: string;
  onSearchChange: (search: string) => void;
  onSearchSubmit: (name: string) => void;
  isSearching: boolean;
  autocompleteSuggestions: string[];
  selectedCardName: string | null;
  searchResults: SearchProduct[];
  addingToCart: Set<string>;
  onAddToCart: (product: SearchProduct) => void;
}

export function ProductSearchCard({
  productSearch,
  onSearchChange,
  onSearchSubmit,
  isSearching,
  autocompleteSuggestions,
  selectedCardName,
  searchResults,
  addingToCart,
  onAddToCart,
}: ProductSearchCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Add Products</CardTitle>
        <CardDescription className="text-xs">
          Search for products to add to cart (local & import)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Type card name…"
            value={productSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && productSearch.trim()) {
                onSearchSubmit(productSearch.trim());
              }
            }}
            className="pl-9"
          />
          {isSearching && (
            <SpinnerIos20Regular className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Autocomplete Suggestions */}
        {autocompleteSuggestions.length > 0 && !selectedCardName && (
          <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-lg">
            {autocompleteSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="w-full text-left p-2 hover:bg-muted cursor-pointer text-sm transition-colors"
                onClick={() => onSearchSubmit(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="border rounded-md max-h-64 overflow-y-auto divide-y">
            {searchResults.map((product) => (
              <div
                key={product.id || product.importationId}
                className="flex items-center gap-3 p-3 hover:bg-muted/50"
              >
                <SafeImg
                  src={product.img || product.imageUrl}
                  alt=""
                  className="h-24 w-18 object-cover rounded border shrink-0"
                  fallback={
                    <div className="h-24 w-18 bg-muted rounded border shrink-0 flex items-center justify-center">
                      <Cart24Regular className="size-8 text-muted-foreground opacity-20" />
                    </div>
                  }
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium truncate">
                      {product.name || product.cardName || product.title}
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
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    {product.expansion && <span>{product.expansion}</span>}
                    {product.cardNumber && <span>#{product.cardNumber}</span>}
                    {product.variant && product.variant !== product.expansion && (
                      <>
                        <span className="mx-0.5">•</span>
                        <span>{product.variant}</span>
                      </>
                    )}
                    {product.price && (
                      <>
                        <span className="mx-0.5">•</span>
                        <span className="font-semibold text-foreground">
                          {typeof product.price === 'number'
                            ? `$${product.price.toFixed(2)}`
                            : product.price}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={addingToCart.has(product.id || product.importationId || '')}
                  onClick={() => onAddToCart(product)}
                >
                  {addingToCart.has(product.id || product.importationId || '') ? (
                    <SpinnerIos20Regular className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Add24Regular className="size-4 mr-1" /> Add
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {productSearch && !isSearching && searchResults.length === 0 && selectedCardName && (
          <div className="text-sm text-muted-foreground text-center py-2">
            No stock found for &quot;{selectedCardName}&quot;
          </div>
        )}
      </CardContent>
    </Card>
  );
}
