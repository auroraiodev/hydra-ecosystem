'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search24Regular, ArrowSync24Regular } from '@fluentui/react-icons';
import type { MinimalProduct } from '@/components/cart/types';
import { CartSearchItem } from './CartSearchItem';

interface CartSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  results: MinimalProduct[];
  addingToCart: Set<string>;
  onAddToCart: (product: MinimalProduct) => void;
}

export function CartSearch({
  query,
  onQueryChange,
  onSearch,
  isSearching,
  results,
  addingToCart,
  onAddToCart,
}: CartSearchProps) {
  return (
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
          {isSearching ? (
            <ArrowSync24Regular className="size-4 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="border rounded-md max-h-48 overflow-y-auto divide-y shadow-inner bg-muted/5">
          {results.map((product) => (
            <CartSearchItem
              key={`${product.id || product.importationId}`}
              product={product}
              isAdding={addingToCart.has(product.id || product.importationId || '')}
              onAdd={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
