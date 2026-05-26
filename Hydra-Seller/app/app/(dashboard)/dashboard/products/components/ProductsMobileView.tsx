import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Box24Regular,
  Edit24Regular,
  Delete24Regular,
  Subtract24Regular,
  Add24Regular,
} from '@fluentui/react-icons';
import { ProductImageZoom } from '@/components/product-image-zoom';
import type { Product, ApiProduct } from '../types';
import { cn } from '@/lib/utils';

interface ProductsMobileViewProps {
  sortedProducts: Product[];
  apiProducts: ApiProduct[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  handleEditProduct: (product: Product) => void;
  handleDeleteProduct: (id: string) => void;
  handleStockChange: (product: Product, delta: number) => void;
  handleConditionChange: (product: Product, value: string) => void;
  handleLanguageChange: (product: Product, value: string) => void;
  handleToggleTag: (productId: string, tagName: string, hasTag: boolean) => void;
  updatingStock: Set<string>;
  updatingCondition: Set<string>;
  updatingLanguage: Set<string>;
  isDeleting: boolean;
  conditions: Array<{ id: string; name: string; display_name?: string }>;
  languages: Array<{ id: string; name: string; display_name?: string }>;
}

export function ProductsMobileView({
  sortedProducts,
  apiProducts,
  selectedIds,
  toggleSelect,
  handleEditProduct,
  handleDeleteProduct,
  handleStockChange,
  handleConditionChange,
  handleLanguageChange,
  handleToggleTag,
  updatingStock,
  updatingCondition,
  updatingLanguage,
  isDeleting,
  conditions,
  languages,
}: ProductsMobileViewProps) {
  return (
    <div className="block lg:hidden space-y-4 pb-20">
      {sortedProducts.map((product) => (
        <div
          key={product.id}
          className={cn(
            'glass-card p-5 space-y-4 transition-all active:scale-[0.98]',
            selectedIds.has(product.id)
              ? 'ring-2 ring-primary/40 bg-primary/[0.04]'
              : 'border-primary/5'
          )}
        >
          {/* Header Area */}
          <div className="flex items-start gap-4">
            <Checkbox
              checked={selectedIds.has(product.id)}
              onCheckedChange={() => toggleSelect(product.id)}
              className="mt-1 border-primary/20 data-[state=checked]:bg-primary size-5 rounded-md"
              aria-label={`Seleccionar ${product.name}`}
            />
            <div className="relative w-16 h-24 shrink-0 rounded-xl overflow-hidden ring-1 ring-primary/5 shadow-sm">
              <ProductImageZoom
                src={product.img}
                alt={product.name}
                className="size-full object-cover"
                fallbackIcon={<Box24Regular className="size-6 text-muted-foreground opacity-20" />}
              />
              {product.foil && (
                <div className="absolute top-0 right-0 px-1 py-0.5 bg-primary text-[7px] font-black text-primary-foreground uppercase tracking-tighter">
                  FOIL
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-24">
              <div>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-primary/20 text-primary bg-primary/5">
                    {product.tcg}
                  </span>
                  <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {product.category}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">
                  {product.cardSet} {product.cardNumber && `\u2022 #${product.cardNumber}`}
                </p>
              </div>

              <div className="text-lg font-black text-primary tabular-nums">
                <span className="text-xs mr-0.5 opacity-40">$</span>
                {product.price.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Controls Area */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-5 border-y border-primary/5">
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block">
                Inventario
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleStockChange(product, -1)}
                  disabled={updatingStock.has(product.id) || isDeleting}
                  className="size-10 rounded-2xl bg-muted/30 flex items-center justify-center hover:bg-primary/10 hover:text-primary active:scale-90 transition-all disabled:opacity-20"
                  aria-label="Reducir stock"
                >
                  <Subtract24Regular className="size-4" />
                </button>
                <span
                  className={cn(
                    'text-sm font-black tabular-nums w-4 text-center',
                    product.stock > 5
                      ? 'text-primary'
                      : product.stock > 0
                        ? 'text-orange-500'
                        : 'text-destructive'
                  )}
                >
                  {updatingStock.has(product.id) ? '...' : product.stock}
                </span>
                <button
                  onClick={() => handleStockChange(product, +1)}
                  disabled={updatingStock.has(product.id)}
                  className="size-10 rounded-2xl bg-muted/30 flex items-center justify-center hover:bg-primary/10 hover:text-primary active:scale-90 transition-all disabled:opacity-20"
                  aria-label="Aumentar stock"
                >
                  <Add24Regular className="size-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block">
                Estado
              </span>
              <select
                value={product.condition_id || ''}
                onChange={(e) => handleConditionChange(product, e.target.value)}
                disabled={updatingCondition.has(product.id)}
                className="w-full text-[10px] font-black uppercase tracking-wider border-none bg-primary/5 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                aria-label="Condición del producto"
              >
                {!product.condition_id && <option value="">-</option>}
                {conditions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block">
                Idioma
              </span>
              <select
                value={product.language_id || ''}
                onChange={(e) => handleLanguageChange(product, e.target.value)}
                disabled={updatingLanguage.has(product.id)}
                className="w-full text-[10px] font-black uppercase tracking-wider border-none bg-primary/5 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                aria-label="Idioma del producto"
              >
                {!product.language_id && <option value="">-</option>}
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.display_name || l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary Details */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block mb-1">
                Detalles
              </span>
              <div className="flex flex-wrap gap-1.5">
                <div className="px-2 py-1 bg-muted/30 rounded-lg text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                  Origen: {product.originLabel}
                </div>
                {['Reestock', 'Commander', 'Personal', 'cEDH Staple'].map((tagName) => {
                  const apiProduct = apiProducts.find((p) => p.id === product.id);
                  const hasTag = apiProduct?.tags?.some(
                    (t) => t.name.toLowerCase() === tagName.toLowerCase()
                  );
                  return (
                    <button
                      key={tagName}
                      onClick={() => handleToggleTag(product.id, tagName, !!hasTag)}
                      className={cn(
                        'px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all',
                        hasTag
                          ? 'bg-primary/20 text-primary ring-1 ring-primary/20'
                          : 'bg-muted/30 text-muted-foreground/40 hover:bg-muted/50'
                      )}
                    >
                      {tagName}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-11 rounded-2xl border-primary/5 shadow-sm hover:bg-primary/5 active:scale-95"
                onClick={() => handleEditProduct(product)}
              >
                <Edit24Regular className="size-4 text-primary" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-11 rounded-2xl border-destructive/10 text-destructive hover:bg-destructive/5 active:scale-95 shadow-sm"
                onClick={() => handleDeleteProduct(product.id)}
                disabled={isDeleting}
              >
                <Delete24Regular className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
