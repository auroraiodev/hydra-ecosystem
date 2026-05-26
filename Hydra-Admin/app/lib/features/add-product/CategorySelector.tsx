'use client';

import React from 'react';
import Image from 'next/image';
import { Box16Regular } from '@fluentui/react-icons';
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
      <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground mr-1">
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
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
            }`}
          >
            {cat.image_url ? (
              <Image
                src={resolveImageUrl(cat.image_url)}
                alt=""
                width={14}
                height={14}
                className={`object-cover rounded-sm ${isSelected ? 'brightness-0 invert' : ''}`}
                unoptimized
              />
            ) : (
              <Box16Regular className="size-3" />
            )}
            {cat.displayName || cat.name}
          </button>
        );
      })}
    </div>
  );
}
