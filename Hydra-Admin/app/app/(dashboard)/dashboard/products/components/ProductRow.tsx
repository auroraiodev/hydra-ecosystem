import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ProductImageZoom } from '@/components/product-image-zoom';
import { Box24Regular, Edit24Regular, Delete24Regular, Subtract24Regular, Add24Regular } from '@fluentui/react-icons';
import type { Product } from '../types';

interface ProductRowProps {
  product: Product;
  status: {
    isSelected: boolean;
    isUpdatingStock: boolean;
    isUpdatingCondition: boolean;
    isUpdatingLanguage: boolean;
    isDeleting: boolean;
  };
  onToggleSelect: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onStockChange: (product: Product, delta: number) => void;
  onConditionChange: (product: Product, value: string) => void;
  onLanguageChange: (product: Product, value: string) => void;
  onToggleTag: (productId: string, tagName: string, hasTag: boolean) => Promise<void>;
  onToggleFoil: (productId: string, currentFoil: boolean) => Promise<void>;
  conditions: Array<{ id: string; name: string; display_name?: string }>;
  languages: Array<{ id: string; name: string; display_name?: string }>;
}

export function ProductRow({
  product,
  status,
  onToggleSelect,
  onEdit,
  onDelete,
  onStockChange,
  onConditionChange,
  onLanguageChange,
  onToggleTag,
  onToggleFoil,
  conditions,
  languages,
}: ProductRowProps) {
  const { isSelected, isUpdatingStock, isUpdatingCondition, isUpdatingLanguage, isDeleting } = status;
  return (
    <tr className={`group border-b border-primary/5 hover:bg-primary/[0.02] transition-all duration-300 ${isSelected ? 'bg-primary/[0.04]' : ''}`}>
      <td className="px-6 py-4 align-middle">
        <Checkbox
          checked={isSelected}
          onChange={() => onToggleSelect(product.id)}
          className="border-2 border-border/80 hover:border-primary/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary transition-transform group-hover:scale-110"
          aria-label={`Seleccionar ${product.name}`}
        />
      </td>
      <td className="p-4 align-middle">
        <div className="relative w-14 h-20 shrink-0 rounded-lg overflow-hidden ring-1 ring-primary/5 group-hover:ring-primary/20 transition-all shadow-sm">
          <ProductImageZoom
            src={product.img}
            alt={product.name}
            className="size-full object-cover"
            fallbackIcon={<Box24Regular className="size-6 text-muted-foreground opacity-20" />}
          />
          {product.foil && (
            <div className="absolute top-0 right-0 px-1 py-0.5 bg-primary text-[7px] font-black text-primary-foreground shadow-sm z-10 uppercase tracking-tighter">
              FOIL
            </div>
          )}
        </div>
      </td>
      <td className="p-4 align-middle">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-foreground group-hover:text-primary transition-colors">{product.name}</span>
          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            {product.cardSet} {product.cardNumber && `\u2022 #${product.cardNumber}`}
          </span>
        </div>
      </td>
      <td className="p-4 align-middle">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border border-primary/20 text-primary bg-primary/5">
            {product.tcg}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">
            {product.category} • {product.originLabel}
          </span>
        </div>
      </td>
      <td className="p-4 align-middle">
        <select
          value={product.condition_id || ''}
          onChange={(e) => onConditionChange(product, e.target.value)}
          disabled={isUpdatingCondition}
          className="text-[10px] font-black uppercase tracking-wider border border-primary/20 bg-accent text-primary rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50 appearance-none cursor-pointer hover:bg-accent hover:border-primary/30"
          aria-label={`Estado de ${product.name}`}
        >
          {!product.condition_id && <option value="">-</option>}
          {conditions.map((c) => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}
        </select>
      </td>
      <td className="p-4 align-middle text-right tabular-nums font-black text-primary text-base">
        <span className="text-xs mr-0.5 opacity-40">$</span>
        {product.price.toLocaleString()}
      </td>
      <td className="p-4 align-middle">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onStockChange(product, -1)}
            disabled={isUpdatingStock || isDeleting}
            className="size-8 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary/30 disabled:opacity-20 transition-all active:scale-90"
            aria-label={`Reducir stock de ${product.name}`}
          >
            <Subtract24Regular className="size-3" />
          </button>
          <div className="w-10 text-center">
            <span className={`text-xs font-black tabular-nums transition-colors ${product.stock > 5 ? 'text-primary' : product.stock > 0 ? 'text-orange-500' : 'text-destructive'}`}>
              {isUpdatingStock ? '...' : product.stock}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onStockChange(product, +1)}
            disabled={isUpdatingStock}
            className="size-8 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary/30 disabled:opacity-20 transition-all active:scale-90"
            aria-label={`Aumentar stock de ${product.name}`}
          >
            <Add24Regular className="size-3" />
          </button>
        </div>
      </td>
      <td className="p-4 align-middle">
        <select
          value={product.language_id || ''}
          onChange={(e) => onLanguageChange(product, e.target.value)}
          disabled={isUpdatingLanguage}
          className="text-[10px] font-black uppercase tracking-wider border border-border bg-background text-foreground rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50 appearance-none cursor-pointer hover:bg-muted/80 hover:border-primary/30"
          aria-label={`Idioma de ${product.name}`}
        >
          {!product.language_id && <option value="">-</option>}
          {languages.map((l) => <option key={l.id} value={l.id}>{l.display_name || l.name}</option>)}
        </select>
      </td>
      <td className="p-4 align-middle">
        <div className="flex flex-wrap gap-1 min-w-[140px]">
          {['Reestock', 'Commander', 'Personal', 'cEDH Staple'].map((tagName) => {
            const currentTags = product.tags || [];
            const hasTag = currentTags.some(t => t.toLowerCase() === tagName.toLowerCase());
            return (
              <button
                type="button"
                key={tagName}
                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter transition-all border ${
                  hasTag
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-primary/30'
                }`}
                onClick={async () => await onToggleTag(product.id, tagName, hasTag)}
              >
                {tagName}
              </button>
            );
          })}
        </div>
      </td>
      <td className="p-4 align-middle text-center">
        <div
          role="switch"
          aria-checked={!!product.foil}
          aria-label={`Versión foil de ${product.name}`}
          tabIndex={0}
          className={`mx-auto w-8 h-4 rounded-full relative transition-all duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40 border ${
            product.foil
              ? 'bg-primary border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]'
              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700'
          }`}
          onClick={() => onToggleFoil(product.id, !!product.foil)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              onToggleFoil(product.id, !!product.foil);
            }
          }}
        >
          <div className={`absolute top-[1px] size-2.5 rounded-full transition-all shadow-sm ${product.foil ? 'left-[17px] bg-white' : 'left-0.5 bg-zinc-400 dark:bg-zinc-500'}`} />
        </div>
      </td>
      <td className="px-6 py-4 align-middle text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="outline" size="icon" className="size-8 rounded-lg border border-border bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30 flex items-center justify-center transition-all" onClick={() => onEdit(product)}>
            <Edit24Regular className="size-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="size-8 rounded-lg border border-border bg-background text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 flex items-center justify-center transition-all" onClick={() => onDelete(product.id)} disabled={isDeleting}>
            <Delete24Regular className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
