'use client';

import Image from 'next/image';
import { Box24Regular } from '@fluentui/react-icons';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import type { Category } from './types';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category | null) => void;
}

export function CategorySelector({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategorySelectorProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <span className="text-[10px] font-semibold uppercase tracking-tighter text-muted-foreground mr-1">
        Categoría:
      </span>
      {categories.map((category) => {
        const cat = category as Category;
        const isSelected = selectedCategory?.id === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold transition-all ${
              isSelected
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800'
            }`}
          >
            {cat.image_url ? (
              <div
                className={`relative size-3.5 overflow-hidden rounded-sm ${isSelected ? 'brightness-0 invert' : ''}`}
              >
                <Image
                  src={resolveImageUrl(cat.image_url)}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <Box24Regular className="size-3" />
            )}
            {cat.displayName || cat.name}
          </button>
        );
      })}
    </div>
  );
}
