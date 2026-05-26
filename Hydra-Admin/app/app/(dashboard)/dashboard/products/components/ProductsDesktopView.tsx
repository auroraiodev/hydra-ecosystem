import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronUpDown24Regular,
  ChevronUp24Regular,
  ChevronDown24Regular,
} from '@fluentui/react-icons';
import type { Product } from '../types';
import { ProductRow } from './ProductRow';

interface ProductsDesktopViewProps {
  sortedProducts: Product[];
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
  handleOwnerChange: (product: Product, value: string) => void;
  handleLanguageChange: (product: Product, value: string) => void;
  handleToggleTag: (productId: string, tagName: string, hasTag: boolean) => Promise<void>;
  handleToggleFoil: (productId: string, currentFoil: boolean) => Promise<void>;
  updatingStock: Set<string>;
  updatingCondition: Set<string>;
  updatingOwner: Set<string>;
  updatingLanguage: Set<string>;
  isDeleting: boolean;
  conditions: Array<{ id: string; name: string; display_name?: string }>;
  users: Array<{ id: string; email: string; firstName?: string; lastName?: string }>;
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
    return <ChevronUpDown24Regular className="size-4 ml-1 opacity-50" />;
  }
  return sortDirection === 'asc' ? (
    <ChevronUp24Regular className="size-4 ml-1" />
  ) : (
    <ChevronDown24Regular className="size-4 ml-1" />
  );
}

export function ProductsDesktopView({
  sortedProducts,
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
                onChange={toggleSelectAll}
                className="border-primary/20 data-[state=checked]:bg-primary"
                aria-label="Seleccionar todos los productos"
              />
            </th>
            <th className="h-14 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50 align-middle bg-muted/20">
              Imagen
            </th>
            <th
              className="h-14 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50 align-middle cursor-pointer hover:bg-primary/5 transition-colors bg-muted/20 outline-none focus-visible:bg-primary/10"
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
            <th className="h-14 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50 align-middle bg-muted/20">
              Tipo
            </th>
            <th
              className="h-14 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50 align-middle cursor-pointer hover:bg-primary/5 transition-colors bg-muted/20 outline-none focus-visible:bg-primary/10"
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
              className="h-14 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50 align-middle text-right cursor-pointer hover:bg-primary/5 transition-colors bg-muted/20 outline-none focus-visible:bg-primary/10"
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
              className="h-14 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50 align-middle text-right cursor-pointer hover:bg-primary/5 transition-colors bg-muted/20 outline-none focus-visible:bg-primary/10"
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
            <th className="h-14 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50 align-middle bg-muted/20">
              Idioma
            </th>
            <th className="h-14 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50 align-middle bg-muted/20">
              Etiquetas
            </th>
            <th className="h-14 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50 align-middle text-center bg-muted/20">
              Foil
            </th>
            <th className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50 align-middle text-right bg-muted/20 last:rounded-tr-2xl">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="before:block before:h-2">
          {sortedProducts.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              status={{
                isSelected: selectedIds.has(product.id),
                isUpdatingStock: updatingStock.has(product.id),
                isUpdatingCondition: updatingCondition.has(product.id),
                isUpdatingLanguage: updatingLanguage.has(product.id),
                isDeleting: isDeleting,
              }}
              onToggleSelect={toggleSelect}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onStockChange={handleStockChange}
              onConditionChange={handleConditionChange}
              onLanguageChange={handleLanguageChange}
              onToggleTag={handleToggleTag}
              onToggleFoil={handleToggleFoil}
              conditions={conditions}
              languages={languages}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
