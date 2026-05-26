'use client';

import { Search24Regular, ArrowSync24Regular, Add24Regular, Cart24Regular } from '@fluentui/react-icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SafeImg } from '@/components/ui/safe-img';
import { Badge } from '@/components/ui/badge';

interface SearchResultProduct {
  id?: string;
  importationId?: string;
  importation_id?: string;
  name?: string;
  cardName?: string;
  title?: string;
  price?: string | number;
  imageUrl?: string;
  img?: string;
  language?: string;
  lang?: string;
  foil?: boolean;
  isFoil?: boolean;
  expansion?: string;
  variant?: string;
  cardNumber?: string;
  isLocalInventory?: boolean;
}

interface CartManagementDialogSearchProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: SearchResultProduct[];
  isSearching: boolean;
  onSearch: () => void;
  onAddToCart: (product: SearchResultProduct) => void;
  addingToCart: Set<string>;
}

export function CartManagementDialogSearch({
  query,
  onQueryChange,
  results,
  isSearching,
  onSearch,
  onAddToCart,
  addingToCart,
}: CartManagementDialogSearchProps) {
  return (
    <>
      {/* Product Search */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search products to add..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="pl-9"
            />
          </div>
          <Button size="sm" onClick={onSearch} disabled={isSearching}>
            {isSearching ? <ArrowSync24Regular className="size-4 animate-spin" /> : 'Search'}
          </Button>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="border rounded-md max-h-48 overflow-y-auto divide-y">
            {results.map((product, index) => (
              <div
                key={product.id || product.importationId || `search-result-${index}`}
                className="flex items-center justify-between p-2 hover:bg-muted/50 text-sm"
              >
                <div className="flex gap-3 flex-1 min-w-0">
                  <SafeImg
                    src={product.img || product.imageUrl}
                    alt=""
                    className="h-20 w-15 object-cover rounded border shrink-0"
                    fallback={
                      <div className="h-20 w-15 bg-muted rounded border shrink-0 flex items-center justify-center">
                        <Cart24Regular className="size-6 text-muted-foreground opacity-20" />
                      </div>
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium truncate">
                        {product.name || product.cardName || product.title}
                      </p>
                      {(product.foil || product.isFoil) && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-yellow-400 text-yellow-950 border-none font-bold shrink-0">
                          FOIL
                        </Badge>
                      )}
                      {(product.language || product.lang) && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 bg-zinc-100 text-zinc-700 border-zinc-200 uppercase font-bold shrink-0"
                        >
                          {product.language || product.lang}
                        </Badge>
                      )}
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
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 shrink-0"
                  disabled={addingToCart.has(product.id || product.importationId || '')}
                  onClick={() => onAddToCart(product)}
                >
                  {addingToCart.has(product.id || product.importationId || '') ? (
                    <ArrowSync24Regular className="size-3.5 animate-spin" />
                  ) : (
                    <Add24Regular className="size-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
