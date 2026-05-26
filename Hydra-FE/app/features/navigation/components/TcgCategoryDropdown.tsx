'use client';

import { cn } from '@/lib/utils';
import { tcgNameToSlug } from '@/lib/utils/tcgSlug';
import { useRouter } from 'next/navigation';
import type { TcgCategoryDropdownProps } from '../types';

export function TcgCategoryDropdown({
  dropdownRef,
  dropdownPos,
  catsLoading,
  catsError,
  categories,
  selectedTcg,
  pathname,
  activeCategory,
  onClose,
  onCategoryClick,
}: TcgCategoryDropdownProps) {
  const { push } = useRouter();
  const tcgSlug = tcgNameToSlug(selectedTcg?.name || '');

  return (
    <div
      ref={dropdownRef}
      className="fixed w-48 vault-glass-panel rounded-xl py-1.5 z-[60]"
      style={
        dropdownPos ? { left: dropdownPos.left, top: dropdownPos.top } : { left: 24, top: 100 }
      }
    >
      {catsLoading ? (
        [1, 2, 3].map((num) => (
          <div
            key={`cat-drop-skeleton-${num}`}
            className="mx-3 my-1.5 h-7 rounded-lg bg-white/10 animate-pulse"
          />
        ))
      ) : catsError ? (
        <p className="px-4 py-2 text-sm text-red-400">Error al cargar</p>
      ) : categories.length === 0 ? (
        <p className="px-4 py-2 text-sm text-vault-text-muted text-center">Sin categorías</p>
      ) : (
        <>
          <button
            onClick={() => {
              onClose();
              push(`/${tcgSlug}`);
            }}
            className={cn(
              'w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer',
              pathname === `/${tcgSlug}`
                ? 'text-teal font-semibold bg-teal/10'
                : 'text-vault-text-muted hover:bg-white/5 hover:text-white'
            )}
          >
            Todos
          </button>
          <div className="h-px bg-white/10 my-1 mx-3" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryClick(cat)}
              className={cn(
                'w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer',
                activeCategory === cat.name
                  ? 'text-teal font-semibold bg-teal/10'
                  : 'text-vault-text-muted hover:bg-white/5 hover:text-white'
              )}
            >
              {cat.display_name || cat.name}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
