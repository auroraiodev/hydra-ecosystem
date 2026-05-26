import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ProductImageZoom } from '@/components/product-image-zoom';
import {
  ArrowSort24Regular,
  ArrowUp24Regular,
  ArrowDown24Regular,
  Box24Regular,
  Edit24Regular,
  Delete24Regular,
  Subtract24Regular,
  Add24Regular,
} from '@fluentui/react-icons';
import type { Product, ApiProduct } from '../types';

interface ProductsDesktopViewProps {
  sortedProducts: Product[];
  apiProducts: ApiProduct[];
  selectedIds: Set<string>;
  allSelected: boolean;
  someSelected: boolean;
  sortField: keyof Product;
  sortDirection: 'asc' | 'desc';
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  handleSort: (field: keyof Product) => void;
  handleEditProduct: (product: Product) => void;
  handleDeleteProduct: (id: string) => void;
  handleStockChange: (product: Product, delta: number) => void;
  handleConditionChange: (product: Product, value: string) => void;
  handleLanguageChange: (product: Product, value: string) => void;
  handleToggleTag: (productId: string, tagName: string, hasTag: boolean) => Promise<void>;
  handleToggleFoil: (productId: string, currentFoil: boolean) => Promise<void>;
  updatingStock: Set<string>;
  updatingCondition: Set<string>;
  updatingLanguage: Set<string>;
  isDeleting: boolean;
  conditions: Array<{ id: string; name: string; display_name?: string }>;
  languages: Array<{ id: string; name: string; display_name?: string }>;
}

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: keyof Product;
  sortField: keyof Product;
  sortDirection: 'asc' | 'desc';
}) {
  if (sortField !== field) {
    return <ArrowSort24Regular className="size-4 ml-1 opacity-50" />;
  }
  return sortDirection === 'asc' ? (
    <ArrowUp24Regular className="size-4 ml-1" />
  ) : (
    <ArrowDown24Regular className="size-4 ml-1" />
  );
}

export function ProductsDesktopView({
  sortedProducts,
  apiProducts,
  selectedIds,
  allSelected,
  someSelected,
  sortField,
  sortDirection,
  toggleSelect,
  toggleSelectAll,
  handleSort,
  handleEditProduct,
  handleDeleteProduct,
  handleStockChange,
  handleConditionChange,
  handleLanguageChange,
  handleToggleTag,
  handleToggleFoil,
  updatingStock,
  updatingCondition,
  updatingLanguage,
  isDeleting,
  conditions,
  languages,
}: ProductsDesktopViewProps) {
  return (
    <div className="hidden lg:block relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm border-separate border-spacing-y-0">
        <thead>
          <tr className="border-b border-primary/5">
            <th className="h-14 px-6 align-middle w-[60px] bg-muted/20 first:rounded-tl-2xl">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={() => toggleSelectAll()}
                className="border-primary/20 data-[state=checked]:bg-primary"
                aria-label="Seleccionar todos los productos"
              />
            </th>
            <th className="h-14 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/50 align-middle bg-muted/20">
              Imagen
            </th>
            <th
              className="h-14 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/50 align-middle cursor-pointer hover:bg-primary/5 transition-colors bg-muted/20 outline-none focus-visible:bg-primary/10"
              onClick={() => handleSort('name')}
              onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && handleSort('name')}
              role="button"
              tabIndex={0}
              aria-label={`Ordenar por producto ${sortField === 'name' ? (sortDirection === 'asc' ? 'descendente' : 'ascendente') : ''}`}
            >
              <div className="flex items-center">
                Producto
                <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
              </div>
            </th>
            <th className="h-14 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/50 align-middle bg-muted/20">
              Tipo
            </th>
            <th
              className="h-14 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/50 align-middle cursor-pointer hover:bg-primary/5 transition-colors bg-muted/20 outline-none focus-visible:bg-primary/10"
              onClick={() => handleSort('condition')}
              onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && handleSort('condition')}
              role="button"
              tabIndex={0}
              aria-label={`Ordenar por estado ${sortField === 'condition' ? (sortDirection === 'asc' ? 'descendente' : 'ascendente') : ''}`}
            >
              <div className="flex items-center">
                Estado
                <SortIcon field="condition" sortField={sortField} sortDirection={sortDirection} />
              </div>
            </th>
            <th
              className="h-14 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/50 align-middle text-right cursor-pointer hover:bg-primary/5 transition-colors bg-muted/20 outline-none focus-visible:bg-primary/10"
              onClick={() => handleSort('price')}
              onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && handleSort('price')}
              role="button"
              tabIndex={0}
              aria-label={`Ordenar por precio ${sortField === 'price' ? (sortDirection === 'asc' ? 'descendente' : 'ascendente') : ''}`}
            >
              <div className="flex items-center justify-end">
                Precio
                <SortIcon field="price" sortField={sortField} sortDirection={sortDirection} />
              </div>
            </th>
            <th
              className="h-14 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/50 align-middle text-right cursor-pointer hover:bg-primary/5 transition-colors bg-muted/20 outline-none focus-visible:bg-primary/10"
              onClick={() => handleSort('stock')}
              onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && handleSort('stock')}
              role="button"
              tabIndex={0}
              aria-label={`Ordenar por inventario ${sortField === 'stock' ? (sortDirection === 'asc' ? 'descendente' : 'ascendente') : ''}`}
            >
              <div className="flex items-center justify-end">
                Inventario
                <SortIcon field="stock" sortField={sortField} sortDirection={sortDirection} />
              </div>
            </th>
            <th className="h-14 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/50 align-middle bg-muted/20">
              Idioma
            </th>
            <th className="h-14 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/50 align-middle bg-muted/20">
              Etiquetas
            </th>
            <th className="h-14 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/50 align-middle text-center bg-muted/20">
              Foil
            </th>
            <th className="h-14 px-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/50 align-middle text-right bg-muted/20 last:rounded-tr-2xl">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="before:block before:h-2">
          {sortedProducts.map((product) => (
            <tr
              key={product.id}
              className={`group border-b border-primary/5 hover:bg-primary/[0.02] transition-all duration-300 ${selectedIds.has(product.id) ? 'bg-primary/[0.04]' : ''}`}
            >
              <td className="px-6 py-4 align-middle">
                <Checkbox
                  checked={selectedIds.has(product.id)}
                  onCheckedChange={() => toggleSelect(product.id)}
                  className="border-primary/20 data-[state=checked]:bg-primary transition-transform group-hover:scale-110"
                  aria-label={`Seleccionar ${product.name}`}
                />
              </td>
              <td className="p-4 align-middle">
                <div className="relative w-14 h-20 shrink-0 rounded-lg overflow-hidden ring-1 ring-primary/5 group-hover:ring-primary/20 transition-all shadow-sm">
                  <ProductImageZoom
                    src={product.img}
                    alt={product.name}
                    className="size-full object-cover"
                    fallbackIcon={
                      <Box24Regular className="size-6 text-muted-foreground opacity-20" />
                    }
                  />
                  {product.foil && (
                    <div className="absolute top-0 right-0 px-1 py-0.5 bg-primary text-[7px] font-semibold text-primary-foreground shadow-sm z-10 uppercase tracking-tighter">
                      FOIL
                    </div>
                  )}
                </div>
              </td>
              <td className="p-4 align-middle">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {product.name}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                    {product.cardSet} {product.cardNumber && `\u2022 #${product.cardNumber}`}
                  </span>
                </div>
              </td>
              <td className="p-4 align-middle">
                <div className="flex flex-col gap-1">
                  <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border border-primary/20 text-primary bg-primary/5">
                    {product.tcg}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-tight">
                    {product.category} • {product.originLabel}
                  </span>
                </div>
              </td>
              <td className="p-4 align-middle">
                <select
                  value={product.condition_id || ''}
                  onChange={(e) => handleConditionChange(product, e.target.value)}
                  disabled={updatingCondition.has(product.id)}
                  className="text-[10px] font-semibold uppercase tracking-wider border-none bg-primary/5 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 appearance-none cursor-pointer hover:bg-primary/10"
                  aria-label={`Estado de ${product.name}`}
                >
                  {!product.condition_id && <option value="">-</option>}
                  {conditions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.display_name || c.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-4 align-middle text-right tabular-nums font-semibold text-primary text-base">
                <span className="text-xs mr-0.5 opacity-40">$</span>
                {product.price.toLocaleString()}
              </td>
              <td className="p-4 align-middle">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleStockChange(product, -1)}
                    disabled={updatingStock.has(product.id) || isDeleting}
                    className="size-8 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-primary/10 hover:text-primary disabled:opacity-20 transition-all active:scale-90"
                    aria-label={`Reducir stock de ${product.name}`}
                  >
                    <Subtract24Regular className="size-3" />
                  </button>
                  <div className="w-10 text-center">
                    <span
                      className={`text-xs font-semibold tabular-nums transition-colors ${
                        product.stock > 5
                          ? 'text-primary'
                          : product.stock > 0
                            ? 'text-orange-500'
                            : 'text-destructive'
                      }`}
                    >
                      {updatingStock.has(product.id) ? '…' : product.stock}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStockChange(product, +1)}
                    disabled={updatingStock.has(product.id)}
                    className="size-8 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-primary/10 hover:text-primary disabled:opacity-20 transition-all active:scale-90"
                    aria-label={`Aumentar stock de ${product.name}`}
                  >
                    <Add24Regular className="size-3" />
                  </button>
                </div>
              </td>
              <td className="p-4 align-middle">
                <select
                  value={product.language_id || ''}
                  onChange={(e) => handleLanguageChange(product, e.target.value)}
                  disabled={updatingLanguage.has(product.id)}
                  className="text-[10px] font-semibold uppercase tracking-wider border-none bg-primary/5 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 appearance-none cursor-pointer hover:bg-primary/10"
                  aria-label={`Idioma de ${product.name}`}
                >
                  {!product.language_id && <option value="">-</option>}
                  {languages.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.display_name || l.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-4 align-middle">
                <div className="flex flex-wrap gap-1 min-w-[140px]">
                  {['Reestock', 'Commander', 'Personal', 'cEDH Staple'].map((tagName) => {
                    const apiProduct = apiProducts.find((p) => p.id === product.id);
                    const currentTags = apiProduct?.tags || [];
                    const hasTag = currentTags.some(
                      (t) => t.name.toLowerCase() === tagName.toLowerCase()
                    );
                    return (
                      <button
                        type="button"
                        key={tagName}
                        className={`px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-tighter transition-all ${
                          hasTag
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50'
                        }`}
                        onClick={async () => {
                          await handleToggleTag(product.id, tagName, hasTag);
                        }}
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
                  className={`mx-auto w-8 h-4 rounded-full relative transition-all duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    product.foil
                      ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]'
                      : 'bg-muted'
                  }`}
                  onClick={() => handleToggleFoil(product.id, !!product.foil)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleToggleFoil(product.id, !!product.foil);
                    }
                  }}
                >
                  <div
                    className={`absolute top-0.5 size-3 rounded-full bg-white transition-all shadow-sm ${product.foil ? 'left-[18px]' : 'left-0.5'}`}
                  />
                </div>
              </td>
              <td className="px-6 py-4 align-middle text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Edit24Regular className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDeleteProduct(product.id)}
                    disabled={isDeleting}
                  >
                    <Delete24Regular className="size-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
